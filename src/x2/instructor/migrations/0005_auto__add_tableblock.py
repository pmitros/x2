# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'TableBlock'
        db.create_table(u'instructor_tableblock', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('location', self.gf('django.db.models.fields.CharField')(max_length=255, blank=True)),
        ))
        db.send_create_signal(u'instructor', ['TableBlock'])


    def backwards(self, orm):
        # Deleting model 'TableBlock'
        db.delete_table(u'instructor_tableblock')


    models = {
        u'instructor.agent': {
            'Meta': {'object_name': 'Agent'},
            'course': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['instructor.Course']"}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'level': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        u'instructor.assistant': {
            'Meta': {'object_name': 'Assistant', '_ormbases': [u'instructor.Agent']},
            u'agent_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['instructor.Agent']", 'unique': 'True', 'primary_key': 'True'})
        },
        u'instructor.course': {
            'Meta': {'object_name': 'Course'},
            'classroom_layout_path': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'slug': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'term': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        u'instructor.group': {
            'Meta': {'object_name': 'Group', '_ormbases': [u'instructor.Agent']},
            u'agent_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['instructor.Agent']", 'unique': 'True', 'primary_key': 'True'})
        },
        u'instructor.instructor': {
            'Meta': {'object_name': 'Instructor', '_ormbases': [u'instructor.Agent']},
            u'agent_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['instructor.Agent']", 'unique': 'True', 'primary_key': 'True'})
        },
        u'instructor.interaction': {
            'Meta': {'object_name': 'Interaction'},
            'agent_learner': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'l+'", 'symmetrical': 'False', 'to': u"orm['instructor.Agent']"}),
            'agent_teacher': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'t+'", 'symmetrical': 'False', 'to': u"orm['instructor.Agent']"}),
            'audio_path': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'ended_at': ('django.db.models.fields.DateTimeField', [], {'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_rejected': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'started_at': ('django.db.models.fields.DateTimeField', [], {'blank': 'True'}),
            'video_path': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'whiteboard_path': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'})
        },
        u'instructor.session': {
            'Meta': {'object_name': 'Session'},
            'course': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['instructor.Course']"}),
            'ended_at': ('django.db.models.fields.DateTimeField', [], {'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'slug': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'started_at': ('django.db.models.fields.DateTimeField', [], {'blank': 'True'})
        },
        u'instructor.student': {
            'Meta': {'object_name': 'Student', '_ormbases': [u'instructor.Agent']},
            u'agent_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['instructor.Agent']", 'unique': 'True', 'primary_key': 'True'}),
            'interaction_in_progress': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'needs_help': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'profile_img_path': ('django.db.models.fields.CharField', [], {'max_length': '500', 'blank': 'True'})
        },
        u'instructor.tableblock': {
            'Meta': {'object_name': 'TableBlock'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        }
    }

    complete_apps = ['instructor']