from django.db import models
from xblock.core import XBlock, Scope
from xblock.fragment import Fragment
from picklefield.fields import PickledObjectField
from xblock.runtime import KeyValueStore
from .util import make_safe_for_html
import json

class KeyValue(models.Model):
    key = models.CharField(max_length=128, primary_key=True)
    value = PickledObjectField()


class LiteKVS(KeyValueStore):
    # def __init__(self):
    #     pass
    #
    def clear(self):

        """Clear all data from the store."""
        KeyValue.objects.all().delete()

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
        try:
            kv = KeyValue.objects.get(key=self.actual_key(key))
            return kv.value[key.field_name]
        except KeyValue.DoesNotExist:
            return None

    def set(self, key, value):
        """Sets the key to the new value"""
        if self.has(key):
            kv = KeyValue.objects.get(key=self.actual_key(key))
            kv.value[key.field_name] = value
        else:
            kv = KeyValue(self.actual_key(key), {})
            kv.value[key.field_name] = value
        kv.save()

    def delete(self, key):
        kv = KeyValue.objects.get(key=self.actual_key(key))
        del kv.value[key.field_name]
        kv.save()

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

    def has(self, key):
        try:
            KeyValue.objects.get(key=self.actual_key(key))
            return True
        except KeyValue.DoesNotExist:
            return False
        pass


    def as_html(self):
        """Just for our Workbench!"""

        d = {}
        for kv in KeyValue.objects.all():
            d[kv.key] = kv.value

        html = json.dumps(d, sort_keys=True, indent=4)
        return make_safe_for_html(html)



