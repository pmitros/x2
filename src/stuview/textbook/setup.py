
from setuptools import setup

setup(
    name='textbook-xblock',
    version='0.1',
    description='Textbook XBlock sample',
    py_modules=['textbook'],
    install_requires=['XBlock'],
    entry_points={
        'xblock.v1': [
            'textbook = textbook:TextbookBlock',
        ]
    }
)