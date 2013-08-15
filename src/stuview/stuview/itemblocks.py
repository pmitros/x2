from xblock.core import XBlock, Scope, Integer, String, Boolean
from xblock.fragment import Fragment
import requests
from django.utils import simplejson

class ItemBlock(XBlock):

    views = Integer(help="the number of times this block has been viewed",
                    default=0,
                    scope=Scope.user_state)

    input = String(help="Json of input entered by the student, such as answers to questions",
                   default=simplejson.dumps({}),
                   scope=Scope.user_state)

    complete = Boolean("Has the student completed this item?", default=False, scope=Scope.user_state)

    thumb_img = String(help="rendering of the page_view displayed in the thumb",
                       default='../static/img/thumb_default.gif',
                       scope=Scope.content)

    thumb_caption = String(help="usually the title of the block, e.g. Problem 2",
                           default='Missing caption',
                           scope=Scope.content)

    def student_view(self, context):
        return Fragment(u"Student %s View" % self.content_type)

    def page_view(self):
        return Fragment(u'<div class="page"> Page %s View </div>' % self.content_type)

    def thumb_view(self,context):
        thumb_complete = 'thumb_complete' if self.complete else ''  # Todo remove
        html = self.runtime.render_template('static/html/videothumb.html',
                                            thumb_img=self.thumb_img,
                                            thumb_caption=self.thumb_caption,
                                            views=self.views,
                                            complete=self.complete,
                                            thumb_complete=thumb_complete)
        frag = Fragment(html)
        frag.add_javascript_url('static/js/verticalqueue.js')
        frag.initialize_js('VerticalQueue')
        return frag

    def toolbar_view(self):
        button_complete_disabled = 'disabled="disabled"' if self.complete else ""

        html = self.runtime.render_template('static/html/toolbar.html',
                                            button_complete_disabled=button_complete_disabled)
        frag = Fragment(html)
        frag.add_javascript_url('static/js/toolbar.js')
        frag.initialize_js('Toolbar')
        return frag

    @XBlock.json_handler
    def toolbar(self, data):

        if data['request'] == 'complete':
            self.complete = True
            self.save()
            print "complete"
        elif data['request'] == 'help':
            print 'help called for: ', data['issue']

            #str(self.runtime.student_id)

            params = {'session_id': 'sep-1-2013',
                   'student_id': str(2),
                   'description': str(data['issue']),
                   'resource': str(2)}


            req = requests.get('http://localhost:3333/x2/ajax/layout/help-request/new', params=params)

            if req.status_code == 200:
                return req.text
            else:
                return req

        else:
            print 'unknown request'



    @XBlock.json_handler
    def activate(self, data):
        if self.views is None:
            self.views = 0
        self.views += 1
        result = {}
        result['page_view'] = self.page_view().body_html()
        result['thumb_view'] = self.thumb_view(None).body_html()

        parent = self.runtime.get_block(self.parent)
        parent.set_active(self.runtime.usage.id)
        return result

    @XBlock.json_handler
    def forminput(self, data):
        input_dic = simplejson.loads(self.input)
        key = data['key']
        val = data['value']
        input_dic[key] = val
        self.input = simplejson.dumps(input_dic)
        self.save()

        return 'saved %s %s ' % (key,val)

class TextBlock(ItemBlock):


    def page_view(self):

        result = Fragment()
        toolbar_frag  = self.toolbar_view()
        result.add_frag_resources(toolbar_frag)

        html = self.runtime.render_template('static/html/textblock.html', toolbar=toolbar_frag)
        result.add_content(html)
        return result



class VideoBlock(ItemBlock):

    def page_view(self):
        return Fragment(u"""
        <iframe width="560" height="315" src="//www.youtube.com/embed/jz_7_Z0iYt8" frameborder="0" allowfullscreen></iframe>
        """)


class ProblemBlock(ItemBlock):
    content = String(default='Missing Content',
                     help='The HTML file containing the problem content',
                     scope=Scope.content)



    def page_view(self):
        result = Fragment()
        toolbar_frag = self.toolbar_view()
        result.add_frag_resources(toolbar_frag)

        content_html = self.runtime.render_template(self.content, input=simplejson.loads(self.input))
        content_frag = Fragment(content_html)

        html = self.runtime.render_template('static/html/problemblock.html',
                                            toolbar=toolbar_frag,
                                            content=content_frag)
        result.add_content(html)
        return result
