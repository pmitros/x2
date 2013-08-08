
from setuptools import setup

setup(
    name='Stuview',
    version='0.1',
    description='Student View core',
    install_requires=['XBlock'],
    entry_points={
        'xblock.v1': [
            'blockqueuebase = blockqueue:BlockQueueBase',
            'verticalqueue = blockqueue:VerticalQueue',
            'queuewidget = blockqueue:QueueWidget',
            'dtext = dummyblocks:DummyTextBlock',
            'dvideo = dummyblocks:DummyVideoBlock',
            'dproblem = dummyblocks:DummyProblemBlock',
        ]
    }
)