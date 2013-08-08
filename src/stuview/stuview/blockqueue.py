from xblock.core import XBlock, Scope, String
from xblock.fragment import Fragment


class BlockQueueBase(XBlock):
    """ Abstract queue class
    """
    has_children = True

    fubar = String(default="barfu", scope=Scope.content)


class VerticalQueue(BlockQueueBase):

    def student_view(self,context):
        result = Fragment()
        child_frags = self.runtime.render_children(self,context,'thumb_view')
        result.add_frags_resources(child_frags)

        all_html = self.runtime.render_template("static/html/verticalqueue.html",
                                            child_frags=child_frags)
        result.add_content(all_html)
        return result


class QueueWidget(VerticalQueue):

    def student_view(self, context):

        self.fubar = "barbar"
        # print "dir", [(x, getattr(self, x)) for x in dir(self) if not str(x).startswith('__')]

        result = Fragment()

        queue = super(QueueWidget, self).student_view(context)
        result.add_frag_resources(queue)
        html = self.runtime.render_template("static/html/queuewidget.html",
                                            queue=queue)
        result.add_content(html)
        result.add_css_url('static/css/stuview.css')



        return result