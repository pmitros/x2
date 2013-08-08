from collections import namedtuple

from xblock.core import XBlock
from xblock.parse import parse_xml_string
from .runtime import Usage

Scenario = namedtuple("Scenario", "description usage")  # pylint: disable=C0103

SCENARIOS = {}