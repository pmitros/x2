"""The runtime machinery for the XBlock workbench.

Code in this file is a mix of Runtime layer and Workbench layer.

"""

import itertools

try:
    import simplejson as json
except ImportError:
    import json

import logging

from django.template import loader as django_template_loader, \
    Context as DjangoContext

from xblock.core import XBlock, Scope, ModelType
from xblock.runtime import DbModel, KeyValueStore, Runtime, NoSuchViewError
from xblock.fragment import Fragment
from util import make_safe_for_html
from models import SCOPED_KVS, BASE_KVS


log = logging.getLogger(__name__)


class Usage(object):
    """Content usages

    Usages represent uses of content in courses.  They are the basic static
    building block for course content.

    TODO: Not the real way we'll store usages!

    """

    # # An infinite stream of ids, for giving each Usage an id.
    # _ids = itertools.count()

    # Maps ids to Usages, a dict of all instances created, ever.
    _usage_index = {}

    # The set of Usage ids that have been initialized by store_initial_state.
    _inited = set()

    def __init__(self, class_id, children=None, initial_state=None, def_id=None):
        self.id = "usage_%d" %  BASE_KVS.incr('ids',0)
        self.def_id = def_id or ("def_%d" % BASE_KVS.incr('ids', 0))
        self.children = children or []

        usage_data = BASE_KVS.get('USAGE_DATA', {})
        usage_data[self.id] = {
            'class_id': class_id,
            'def_id': self.def_id,
            'children': [x.id for x in self.children]
        }
        BASE_KVS.set('USAGE_DATA', usage_data)

        self.parent = None
        self.block_name = class_id

        self.initial_state = initial_state or {}

        # Update our global index of all usages.
        self._usage_index[self.id] = self

        # Create the parent references as we construct children.
        for child in self.children:
            child.parent = self


    @classmethod
    def recreate(cls, usage_id):

        # if usage_id in cls._usage_index:
        #     raise KeyError('Usage %s is already in the index' % usage_id)

        self = cls.__new__(cls)
        self.id = usage_id
        self.parent = None

        self.block_name = BASE_KVS.get('USAGE_DATA')[self.id]['class_id']
        self.def_id = BASE_KVS.get('USAGE_DATA')[self.id]['def_id']

        children_ids = BASE_KVS.get('USAGE_DATA')[self.id]['children']
        self.children = [Usage.recreate(x) for x in children_ids]

        self._usage_index[self.id] = self

        #TODO store_initial_state or similar might be necessary

        for child in self.children:
            child.parent = self

        return self


    def store_initial_state(self):
        """Ensure that the initial state of this Usage is created.

        This method is called before using the Usage.  It will use the
        `initial_state` argument to the Usage to populate XBlock
        attributes, and then recursively do the same for its children.

        All this work is only done once for each Usage no matter how often
        this function is called.

        """
        # If we've already created the initial state, there's nothing to do.
        if self.id in self._inited:
            return

        # Create an XBlock from this usage, and use it to create the initial
        # state. This block is created just so we can use the block to set
        # attributes, which will cause the data to be written through the
        # fields. This isolates us from the storage mechanism: however the
        # block saves its attributes, that's how the initial state will be
        # saved.
        block = create_xblock(self)
        if self.initial_state:
            for name, value in self.initial_state.items():
                setattr(block, name, value)

        block.children = [child.id for child in self.children]
        if self.parent is not None:
            block.parent = self.parent.id

        # We've initialized this instance, keep track.
        self._inited.add(self.id)

        # Explicitly save all of the initial state we've just written
        block.save()

        # Also do this recursively down the tree.
        for child in self.children:
            child.store_initial_state()

    def __repr__(self):
        return "<{0.__class__.__name__} {0.id} {0.block_name} {0.def_id} {0.children!r}>".format(self)

    @classmethod
    def find_usage(cls, usage_id):
        """Looks up the `usage_id` from our global index of all usages."""
        return cls._usage_index[usage_id]

    @classmethod
    def reinitialize_all(cls):
        """
        Reset all the inited flags, so that Usages will be initialized again.

        Used to isolate tests from each other.

        """
        cls._inited.clear()


class MemoryKeyValueStore(KeyValueStore):
    """Use a simple in-memory database for a key-value store."""
    def __init__(self, db_dict):
        self.db_dict = db_dict

    def clear(self):
        """Clear all data from the store."""
        self.db_dict.clear()

    def actual_key(self, key):
        """
        Constructs the full key name from the given `key`.

        The actual key consists of the scope, block scope id, and student_id.

        """
        key_list = []
        if key.scope == Scope.children:
            key_list.append('children')
        elif key.scope == Scope.parent:
            key_list.append('parent')
        else:
            key_list.append(["usage", "definition", "type", "all"][key.scope.block])

        if key.block_scope_id is not None:
            key_list.append(key.block_scope_id)
        if key.student_id:
            key_list.append(key.student_id)
        return ".".join(key_list)

    def get(self, key):
        return self.db_dict[self.actual_key(key)][key.field_name]

    def set(self, key, value):
        """Sets the key to the new value"""
        self.db_dict.setdefault(self.actual_key(key), {})[key.field_name] = value

    def delete(self, key):
        del self.db_dict[self.actual_key(key)][key.field_name]

    def has(self, key):
        return key.field_name in self.db_dict[self.actual_key(key)]

    def as_html(self):
        """Just for our Workbench!"""
        html = json.dumps(self.db_dict, sort_keys=True, indent=4)
        return make_safe_for_html(html)

    def set_many(self, update_dict):
        """
        Sets many fields to new values in one call.

        `update_dict`: A dictionary of keys: values.
        This method sets the value of each key to the specified new value.
        """
        for key, value in update_dict.items():
            # We just call `set` directly here, because this is an in-memory representation
            # thus we don't concern ourselves with bulk writes.
            self.set(key, value)


from .models import LiteKVS

# GLOBAL_KVS = LiteKVS()
# GLOBAL_KVS = MemoryKeyValueStore({})
# GLOBAL_KVS.clear()



def create_xblock(usage, student_id=None):
    """Create an XBlock instance.

    This will be invoked to create new instances for every request.

    """
    block_cls = XBlock.load_class(usage.block_name)
    runtime = StuviewRuntime(block_cls, student_id, usage)
    model = DbModel(SCOPED_KVS, block_cls, student_id, usage)
    block = block_cls(runtime, model)
    return block


class StuviewRuntime(Runtime):
    """
    Access to the workbench runtime environment for XBlocks.

    A pre-configured instance of this class will be available to XBlocks as
    `self.runtime`.

    """
    def __init__(self, block_cls, student_id, usage):
        super(StuviewRuntime, self).__init__()

        self.block_cls = block_cls
        self.student_id = student_id
        self.usage = usage

    def render(self, block, context, view_name):
        try:
            return super(StuviewRuntime, self).render(block, context, view_name)
        except NoSuchViewError:
            return Fragment(u"<i>No such view: %s on %s</i>"
                            % (view_name, make_safe_for_html(repr(block))))

    # TODO: [rocha] runtime should not provide this, each xblock
    # should use whatever they want
    def render_template(self, template_name, **kwargs):
        """Loads the django template for `template_name`"""
        template = django_template_loader.get_template(template_name)
        return template.render(DjangoContext(kwargs))

    def wrap_child(self, block, frag, context):  # pylint: disable=W0613
        wrapped = Fragment()
        wrapped.add_javascript_url("/static/js/vendor/jquery.min.js")
        wrapped.add_javascript_url("/static/js/vendor/jquery.cookie.js")

        data = {}
        if frag.js_init:
            func, version = frag.js_init
            wrapped.add_javascript_url("/static/js/runtime/%s.js" % version)
            data['init'] = func
            data['runtime-version'] = version
            data['usage'] = self.usage.id
            data['block-type'] = self.block_cls.plugin_name

        if block.name:
            data['name'] = block.name

        html = u"<div class='xblock'%s>%s</div>" % (
            "".join(" data-%s='%s'" % item for item in data.items()),
            frag.body_html(),
        )
        wrapped.add_content(html)
        wrapped.add_frag_resources(frag)
        return wrapped

    def handler_url(self, url):
        return "/handler/{0}/{1}/?student={2}".format(
            self.usage.id,
            url,
            self.student_id
        )

    def get_block(self, usage_id):
        return create_xblock(Usage.find_usage(usage_id), self.student_id)

