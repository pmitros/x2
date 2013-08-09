# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Agent'
        db.create_table(u'instructor_agent', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('course', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('email', self.gf('django.db.models.fields.EmailField')(max_length=75)),
            ('location', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('level', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['instructor.Agent'])),
        ))
        db.send_create_signal(u'instructor', ['Agent'])

        # Adding model 'Student'
        db.create_table(u'instructor_student', (
            (u'agent_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['instructor.Agent'], unique=True, primary_key=True)),
            ('profile_img_path', self.gf('django.db.models.fields.CharField')(max_length=500)),
            ('needs_help', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('interaction_in_progress', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal(u'instructor', ['Student'])

        # Adding model 'Instructor'
        db.create_table(u'instructor_instructor', (
            (u'agent_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['instructor.Agent'], unique=True, primary_key=True)),
        ))
        db.send_create_signal(u'instructor', ['Instructor'])

        # Adding model 'Group'
        db.create_table(u'instructor_group', (
            (u'agent_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['instructor.Agent'], unique=True, primary_key=True)),
        ))
        db.send_create_signal(u'instructor', ['Group'])

        # Adding model 'Assistant'
        db.create_table(u'instructor_assistant', (
            (u'agent_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['instructor.Agent'], unique=True, primary_key=True)),
        ))
        db.send_create_signal(u'instructor', ['Assistant'])

        # Adding model 'Course'
        db.create_table(u'instructor_course', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('slug', self.gf('django.db.models.fields.CharField')(max_length=32)),
            ('term', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('classroom_layout_path', self.gf('django.db.models.fields.URLField')(max_length=200)),
        ))
        db.send_create_signal(u'instructor', ['Course'])

        # Adding model 'Session'
        db.create_table(u'instructor_session', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('slug', self.gf('django.db.models.fields.CharField')(max_length=32)),
            ('course', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['instructor.Course'])),
            ('started_at', self.gf('django.db.models.fields.DateTimeField')()),
            ('ended_at', self.gf('django.db.models.fields.DateTimeField')()),
        ))
        db.send_create_signal(u'instructor', ['Session'])

        # Adding model 'Interaction'
        db.create_table(u'instructor_interaction', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('started_at', self.gf('django.db.models.fields.DateTimeField')()),
            ('ended_at', self.gf('django.db.models.fields.DateTimeField')()),
            ('is_rejected', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('audio_path', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('video_path', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('whiteboard_path', self.gf('django.db.models.fields.URLField')(max_length=200)),
        ))
        db.send_create_signal(u'instructor', ['Interaction'])

        # Adding M2M table for field agent_teacher on 'Interaction'
        m2m_table_name = db.shorten_name(u'instructor_interaction_agent_teacher')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('interaction', models.ForeignKey(orm[u'instructor.interaction'], null=False)),
            ('agent', models.ForeignKey(orm[u'instructor.agent'], null=False))
        ))
        db.create_unique(m2m_table_name, ['interaction_id', 'agent_id'])

        # Adding M2M table for field agent_learner on 'Interaction'
        m2m_table_name = db.shorten_name(u'instructor_interaction_agent_learner')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('interaction', models.ForeignKey(orm[u'instructor.interaction'], null=False)),
            ('agent', models.ForeignKey(orm[u'instructor.agent'], null=False))
        ))
        db.create_unique(m2m_table_name, ['interaction_id', 'agent_id'])


    def backwards(self, orm):
        # Deleting model 'Agent'
        db.delete_table(u'instructor_agent')

        # Deleting model 'Student'
        db.delete_table(u'instructor_student')

        # Deleting model 'Instructor'
        db.delete_table(u'instructor_instructor')

        # Deleting model 'Group'
        db.delete_table(u'instructor_group')

        # Deleting model 'Assistant'
        db.delete_table(u'instructor_assistant')

        # Deleting model 'Course'
        db.delete_table(u'instructor_course')

        # Deleting model 'Session'
        db.delete_table(u'instructor_session')

        # Deleting model 'Interaction'
        db.delete_table(u'instructor_interaction')

        # Removing M2M table for field agent_teacher on 'Interaction'
        db.delete_table(db.shorten_name(u'instructor_interaction_agent_teacher'))

        # Removing M2M table for field agent_learner on 'Interaction'
        db.delete_table(db.shorten_name(u'instructor_interaction_agent_learner'))


    models = {
        u'instructor.agent': {
            'Meta': {'object_name': 'Agent'},
            'course': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'level': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['instructor.Agent']"})
        },
        u'instructor.assistant': {
            'Meta': {'object_name': 'Assistant', '_ormbases': [u'instructor.Agent']},
            u'agent_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['instructor.Agent']", 'unique': 'True', 'primary_key': 'True'})
        },
        u'instructor.course': {
            'Meta': {'object_name': 'Course'},
            'classroom_layout_path': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
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
            'audio_path': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'ended_at': ('django.db.models.fields.DateTimeField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_rejected': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'started_at': ('django.db.models.fields.DateTimeField', [], {}),
            'video_path': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'whiteboard_path': ('django.db.models.fields.URLField', [], {'max_length': '200'})
        },
        u'instructor.session': {
            'Meta': {'object_name': 'Session'},
            'course': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['instructor.Course']"}),
            'ended_at': ('django.db.models.fields.DateTimeField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'slug': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'started_at': ('django.db.models.fields.DateTimeField', [], {})
        },
        u'instructor.student': {
            'Meta': {'object_name': 'Student', '_ormbases': [u'instructor.Agent']},
            u'agent_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['instructor.Agent']", 'unique': 'True', 'primary_key': 'True'}),
            'interaction_in_progress': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'needs_help': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'profile_img_path': ('django.db.models.fields.CharField', [], {'max_length': '500'})
        }
    }

    complete_apps = ['instructor']