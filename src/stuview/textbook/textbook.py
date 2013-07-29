from xblock.fragment import Fragment
from xblock.problem import InputBlock
import pkg_resources

import logging
log = logging.getLogger(__name__)

class TextbookBlock(InputBlock):

    title = "Chapter Uno"

    def student_view(self, context):

        self.title = "Chapter ednorrr"

        # Load the HTML fragment from within the package and fill in the template
        html_str = pkg_resources.resource_string(__name__, "static/html/textbook.html")
        frag = Fragment(unicode(html_str).format(self=self))
        return frag

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("two textbooks at once",
             """\
                <textbook/>
             """)
        ]
