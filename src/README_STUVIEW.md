Installation
============
cd x2/src/XBlock
pip install -r requirements.txt
python setup.py install

Go to /x2/src/stuview and run:
pip install -r requirements
cd stuview
python setup.py develop

Running
=======
cd /x2/src/stuview
python manage.py runserver 2233

#open in browser
localhost:2233/populate
localhost:2233/qwidget?id=Amy
