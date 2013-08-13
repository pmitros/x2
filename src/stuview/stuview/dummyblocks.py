from xblock.core import XBlock, Scope, Integer, String, Boolean
from xblock.fragment import Fragment
import urllib2, urllib

class DummyBlock(XBlock):

    views = Integer(help="the number of times this block has been viewed",
                    default=0,
                    scope=Scope.user_state)
    complete = Boolean("Has the student completed this item?", default=False, scope=Scope.user_state)


    def student_view(self, context):
        return Fragment(u"Student %s View" % self.content_type)

    def page_view(self):
        return Fragment(u'<div class="page"> Page %s View </div>' % self.content_type)

    def thumb_view(self, context):
        frag = Fragment(u'<div class="thumb"> Thumb %s View </div>' % self.content_type)

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

            post_data = [
                ('session_id', 'sep-1-2013'),
                ('student_id', str(self.runtime.student_id)),
                ('description', str(data['issue'])),
                ('resource', str(2))
            ]

            try:
                result = urllib2.urlopen('http://localhost:3333/x2/ajax/layout/help-request/new', urllib.urlencode(post_data))
                content = result.read()
            except urllib2.URLError as e:
                content = str(e)

            print 'content: ', content
            return content
            # return {'status': 'acknowledged'}
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


class DummyTextBlock(DummyBlock):
    content_type = 'Text'

    def thumb_view(self,context):

        thumb_complete = 'thumb_complete' if self.complete else ''

        html = self.runtime.render_template('static/html/videothumb.html',
                                            thumb_img = "../static/img/text.png",
                                            thumb_caption = "Text Caption",
                                            views = self.views,
                                            complete= self.complete,
                                            thumb_complete=thumb_complete)

        frag = Fragment(html)
        frag.add_javascript_url('static/js/verticalqueue.js')
        frag.initialize_js('VerticalQueue')

        return frag

    def page_view(self):

        result = Fragment()
        toolbar_frag  = self.toolbar_view()
        result.add_frag_resources(toolbar_frag)

        html = self.runtime.render_template('static/html/textblock.html', toolbar=toolbar_frag)
        result.add_content(html)
        return result



class DummyVideoBlock(DummyBlock):
    content_type = 'Video'

    def thumb_view(self,context):

        html = self.runtime.render_template('static/html/videothumb.html',
                                            thumb_img = "../static/img/scicook_thumb.jpg",
                                            thumb_caption = "Video Caption",
                                            views = self.views,
                                            complete= self.complete)

        frag = Fragment(html)
        frag.add_javascript_url('static/js/verticalqueue.js')
        frag.initialize_js('VerticalQueue')
        return frag

    def page_view(self):
        return Fragment(u"""
        <iframe width="560" height="315" src="//www.youtube.com/embed/jz_7_Z0iYt8" frameborder="0" allowfullscreen></iframe>
        """)


class DummyProblemBlock(DummyBlock):
    content_type = 'Problem'

    content = String(default='Missing Content',
                             help='The HTML file containing the problem content',
                             scope=Scope.user_state)

    def set_content(self, html_file):
        self.content = html_file
        self.save()

    def thumb_view(self,context):

        thumb_complete = 'thumb_complete' if self.complete else ''
        html = self.runtime.render_template('static/html/videothumb.html',
                                            thumb_img = "../static/img/problem_thumb.png",
                                            thumb_caption = "Problem Caption",
                                            views = self.views,
                                            complete = self.complete,
                                            thumb_complete=thumb_complete)

        frag = Fragment(html)
        frag.add_javascript_url('static/js/verticalqueue.js')
        frag.initialize_js('VerticalQueue')
        return frag

    def page_view(self):
        result = Fragment()
        toolbar_frag = self.toolbar_view()
        result.add_frag_resources(toolbar_frag)

        content_frag = self.runtime.render_template(self.content)

        html = self.runtime.render_template('static/html/problemblock.html',
                                            toolbar=toolbar_frag,
                                            content=content_frag)
        result.add_content(html)
        return result
