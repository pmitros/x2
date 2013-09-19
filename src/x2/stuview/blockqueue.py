from xblock.core import XBlock, Scope, String
from xblock.fragment import Fragment

class BlockQueueBase(XBlock):
    """ Abstract queue class
    """
    has_children = True



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

    active_child_usage_id = String(default='',
                                   help='The usage id of the active child',
                                   scope=Scope.user_state)

    def student_view(self, context):
        result = Fragment()
        queue = super(QueueWidget, self).student_view(context)
        result.add_frag_resources(queue)
        html = self.runtime.render_template("static/html/queuewidget.html",
                                            queue=queue)
        result.add_content(html)
        result.add_css_url('static/css/stuview.css')
        return result

    def queue_view(self, context):
        result = Fragment()
        queue = super(QueueWidget, self).student_view(context)
        result.add_frag_resources(queue)
        html = self.runtime.render_template("static/html/queue.html",
                                            queue=queue)
        result.add_content(html)
        result.add_css_url('static/css/stuview.css')
        return result

    def progress(self):
        total = 0
        completed = 0
        for child in self.children:
            block = self.runtime.get_block(child)
            total += 1
            if block.complete:
                completed += 1

        return {'total': total, 'complete': completed}

    def active_index(self):
        if self.active_child_usage_id == '':
            return -1
        else:
            return self.children.index(self.active_child_usage_id)

    def set_active(self, usage_id):
        self.active_child_usage_id = usage_id
        #print self.active_child_usage_id
        self.save()

    def get_active_inx(self):
        return self.children.index(self.active_child_usage_id)
