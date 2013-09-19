## Instructor Interface
This interface allows instructors running a flipped classroom course to 

1. monitor student progress in realtime, 
2. offer on-demand help, and 
3. capture help interactions using audio recording and shared whiteboard.

## Installation
Required: HTML5-supporting web browser, and node.js

### Clone this repository.

### Pull submodules

    git submodule init
    git submodule update

### Install requirements

    Install requirements from src/x2/apt-get-requirements.txt
    mkvirtualenv x2
    workon x2
    pip install -r src/x2/stuview/requirements.txt
    pip install -r src/x2/requirements.txt
    cd src/XBlock
    pip install -r requirements.txt

### Install packages in virtualenv. 

Run 

    python setup.py develop

In src/XBlock, src/x2/textbook, src/x2/stuview

### Customize settings if necessary

In `src/x2/x2/settings.py`, 

* update TEMPLATE_DIR to include an absolute path to the template directory.
* update MEDIA_ROOT to include an absolute path to the media directory.
* update DATABASES to suit your database setup.

### Set up databases

    python manage.py syncdb
    python manage.py migrate

### Load initial data

You can either start entering data using Django's admin interface,
but for faster testing there is a data dump file with initial dummy data.
Run the loaddata command with `src/x2/instructor-datadump.json`

    python manage.py loaddata instructor-datadump.json
    
For more information, visit https://docs.djangoproject.com/en/1.5/ref/django-admin/#loaddata-fixture-fixture

For student view, navigate to (note: after running server in step below): 

    http://localhost:8000/populate

### Run Django server.

In `src/x2`, run 

    python manage.py runserver 0.0.0.0:8000

### Run Walma server (optional -- not currently used).

The capture interface uses the open source Walma Whiteboard.
Make sure to install and run Walma by visiting https://github.com/opinsys/walma
We assume that Walma is running at http://localhost:1337 (default Walma setting).
A URL to a valid board is required for iframe inside capture_interaction.html

#### Audio/Video capture
We currently use HTML5's webrtc implementation to capture audio (and optionally video).
You need to have browser support for this to work - Chrome or Firefox (hopefully Chrome Canary for Firefox Nightly).
Refer to https://github.com/muaz-khan/WebRTC-Experiment/tree/master/RecordRTC for browser compatibility.


### Access the interfaces from your web browser.

    http://localhost:8000/x2/instructor/6.00x/sep-1-2013/view-layout
    http://localhost:8000/qwidget?student=Amy

6.00x is the course slug, sep-1-2013 is the session slug: they depend on the Course and Session table data.
