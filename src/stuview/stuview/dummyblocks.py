from xblock.core import XBlock, Scope, Integer, String
from xblock.fragment import Fragment

class DummyBlock(XBlock):

    contype = String(help="the type of the content", default="dummy content", scope=Scope.content)
    views = Integer(help="the number of times this block has been viewed",
                    default=0,
                    scope=Scope.user_state)

    def student_view(self, context):
        return Fragment(u"Student %s View" % self.content_type)

    def page_view(self):
        return Fragment(u'<div class="page"> Page %s View </div>' % self.content_type)

    def thumb_view(self, context):
        frag = Fragment(u'<div class="thumb"> Thumb %s View </div>' % self.content_type)
        frag.add_javascript_url('static/js/verticalqueue.js')
        frag.initialize_js('VerticalQueue')
        return frag

    @XBlock.json_handler
    def activate(self, data):
        if self.views is None:
            self.views = 0
        self.views += 1
        result = {}
        result['page_view'] = self.page_view().body_html()
        result['thumb_view'] = self.thumb_view(None).body_html()
        self.contype = "newcon"
        return result


class DummyTextBlock(DummyBlock):
    content_type = 'Text'

    def thumb_view(self,context):

        html = self.runtime.render_template('static/html/videothumb.html',
                                            thumb_img = "../static/img/text.png",
                                            thumb_caption = "Text Caption",
                                            views = self.views)

        frag = Fragment(html)
        frag.add_javascript_url('static/js/verticalqueue.js')
        frag.initialize_js('VerticalQueue')
        print "contype", self.contype
        return frag

    def page_view(self):
        return Fragment(u"""
        <h1> Dolor Sit Amet </h1>
        <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p>
         Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </p>
        """)


class DummyVideoBlock(DummyBlock):
    content_type = 'Video'

    def thumb_view(self,context):

        html = self.runtime.render_template('static/html/videothumb.html',
                                            thumb_img = "../static/img/scicook_thumb.jpg",
                                            thumb_caption = "Video Caption",
                                            views = self.views)

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

    problem_content = """
    Calculate the area under the curve
    """

    def thumb_view(self,context):

        html = self.runtime.render_template('static/html/videothumb.html',
                                            thumb_img = "../static/img/problem_thumb.png",
                                            thumb_caption = "Problem Caption",
                                            views = self.views)

        frag = Fragment(html)
        frag.add_javascript_url('static/js/verticalqueue.js')
        frag.initialize_js('VerticalQueue')
        return frag

    def page_view(self):
        return Fragment(u"""
        <h1> Equivalence Relation </h1>
        <p> In mathematics, an equivalence relation is a relation that is reflexive, symmetric, and transitive.  </p>
        <p> The relation "greater than" is
        <p> symmetric: <select> <option>True</option> <option>False</option> </select> </p>
        <p> reflexive: <select> <option>True</option> <option>False</option> </select> </p>
        <p> transitive: <select> <option>True</option> <option>False</option> </select> </p>
        """)