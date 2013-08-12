from django.db import models
from xblock.core import XBlock, Scope
from xblock.fragment import Fragment
from picklefield.fields import PickledObjectField
from xblock.runtime import KeyValueStore
from .util import make_safe_for_html
import json
import copy

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
            print "key scope block", key.scope.block
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
            raise KeyError(self.actual_key(key))

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


    def as_html(self):
        """Just for our Workbench!"""

        d = {}
        for kv in KeyValue.objects.all():
            d[kv.key] = kv.value

        html = json.dumps(d, sort_keys=True, indent=4)
        return make_safe_for_html(html)


class BaseKVS(object):
    def clear(self):

        """Clear all data from the store."""
        KeyValue.objects.all().delete()

    def get(self, key, default=None):
        try:
            kv = KeyValue.objects.get(key=key)

            return kv.value
        except KeyValue.DoesNotExist:
            if default is None:
                raise KeyError(key)
            else:
                self.set(key, copy.deepcopy(default))
                return self.get(key)

    def xget(self,key):
        try:
            kv = KeyValue.objects.get(key=key)

            def store():
                return kv.save()

            return kv.value, store
        except KeyValue.DoesNotExist:
            raise KeyError(key)

    def incr(self, key, default):
        assert isinstance(default, int)
        if not self.has(key):
            self.set(key,default+1)
            return default
        else:
            i = self.get(key)
            self.set(key, i+1)
            return i


    def set(self, key, value):
        """Sets the key to the new value"""
        if self.has(key):
            kv = KeyValue.objects.get(key=key)
            kv.value = value
        else:
            kv = KeyValue(key, value)
        kv.save()

    def delete(self, key):
        kv = KeyValue.objects.get(key=key)
        del kv

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
            KeyValue.objects.get(key=key)
            return True
        except KeyValue.DoesNotExist:
            return False


    def as_html(self):
        """Just for our Workbench!"""

        d = {}
        for kv in KeyValue.objects.all():
            d[kv.key] = kv.value

        html = json.dumps(d, sort_keys=True, indent=4)
        return make_safe_for_html(html)




class ScopedKVS(KeyValueStore):
    def __init__(self, _base_kvs):
        self._base_kvs = _base_kvs

    def clear(self):
        self._base_kvs.clear()

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
            kvd = self._base_kvs.get(key=self.actual_key(key))
            return kvd[key.field_name]
        except KeyError:
            raise KeyError(self.actual_key(key))

    def set(self, key, value):
        """Sets the key to the new value"""
        if self.has(key):
            kvd, store = self._base_kvs.xget(key=self.actual_key(key))
            kvd[key.field_name] = value
            store()
        else:
            self._base_kvs.set(self.actual_key(key), {})
            kvd, store = self._base_kvs.xget(self.actual_key(key))
            kvd[key.field_name] = value
            store()

    def delete(self, key):
        kvd, store = self._base_kvs.xget(self.actual_key(key))
        del kvd[key.field_name]
        store()

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
            self._base_kvs.get(key=self.actual_key(key))
            return True
        except KeyError:
            return False

    def as_html(self):
        """Just for our Workbench!"""
        return self._base_kvs.as_html()


class UsageManager(object):

    glob_key = 'NAMED_USAGES'

    def __init__(self, _base_kvs):
        self._base_kvs = _base_kvs

    def _key(self, course, lesson, student):
        key = '.'.join([str(x) for x in [course, lesson, student]])
        return key

    def set(self, course, lesson, student, usage):
        scenarios = self._base_kvs.get(self.glob_key, {})
        key = self._key(course, lesson, student)
        scenarios[key] = usage.id
        self._base_kvs.set(self.glob_key, scenarios)

    def get(self, course, lesson, student):
        key = self._key(course, lesson, student)
        scenarios = self._base_kvs.get(self.glob_key)
        return scenarios[key]

    def has(self, course, lesson, student):
        try:
            scenarios = self._base_kvs.get(self.glob_key)
            key = self._key(course, lesson, student)
            if key in scenarios:
                return True
            else:
                return False
        except KeyError:
            return False


BASE_KVS = BaseKVS()
SCOPED_KVS = ScopedKVS(BASE_KVS)
NAMED_USAGES = UsageManager(BASE_KVS)
