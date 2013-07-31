from xblock.core import XBlock
from xblock.fragment import Fragment


class BlockQueue(XBlock):
    has_children = True

    def student_view(self, context):

        result = Fragment()
        child_frags = self.runtime.render_children(self,context,'thumb_view')
        result.add_frags_resources(child_frags)

        all_html = self.runtime.render_template("static/html/verticalqueue.html",
                                            title=u"Block Queue",
                                            child_frags=child_frags)
        result.add_content(all_html)

        result.add_javascript("""
            function Hola(runtime, element) {
            };
            """)
        result.initialize_js('Hola')

        result.add_css_url('static/css/stuview.css')
        return result