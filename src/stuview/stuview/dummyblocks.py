from xblock.core import XBlock
from xblock.fragment import Fragment

class DummyBlock(XBlock):


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
        return self.page_view().body_html()


class DummyTextBlock(DummyBlock):
    content_type = 'Text'


class DummyVideoBlock(DummyBlock):
    content_type = 'Video'


class DummyProblemBlock(DummyBlock):
    content_type = 'Problem'