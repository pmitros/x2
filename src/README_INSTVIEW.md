## Instructor Interface
This interface allows instructors running a flipped classroom course to 

1. monitor student progress in realtime, 
2. offer on-demand help, and 
3. capture help interactions using audio recording and shared whiteboard.

## Installation
Required: Django, HTML5-supporting web browser, and node.js

1. Clone this repository.
2. Customize settings. 
3. Load initial data.
4. Run Django server.
5. Run Walma server.
6. Access the instructor interface from your web browser.

### Step 2. Customize settings.
In `src/x2/x2/settings.py`, 

* update TEMPLATE_DIR to include an absolute path to the template directory.
* update DATABASES to suit your database setup.

### Step 3. Initial Data
You can either start entering data using Django's admin interface,
but for faster testing there is a data dump file with initial dummy data.
Run the loaddata command with `src/x2/instructor-datadump.json`

For more information, visit https://docs.djangoproject.com/en/1.5/ref/django-admin/#loaddata-fixture-fixture

### Step 4. Running Django server
In `src/x2`, run 

    python manage.py runserver 0.0.0.0:3333

### Step 5. Shared Whiteboard
The capture interface uses the open source Walma Whiteboard.
Make sure to install and run Walma by visiting https://github.com/opinsys/walma
We assume that Walma is running at http://localhost:1337 (default Walma setting).
A URL to a valid board is required for iframe inside capture_interaction.html

### Step 6. Open the interface.
    http://localhost:3333/instructor/6.00x/sep-1-2013/view-layout

6.00x is the course slug, sep-1-2013 is the session slug: they depend on the Course and Session table data.

#### Audio/Video capture
We currently use HTML5's webrtc implementation to capture audio (and optionally video).
You need to have browser support for this to work - Chrome or Firefox (hopefully Chrome Canary for Firefox Nightly)

