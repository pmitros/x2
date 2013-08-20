# PyQT4 imports
from PyQt4 import QtGui, QtCore, QtOpenGL
from PyQt4.QtOpenGL import QGLWidget
# PyOpenGL imports
import OpenGL.GL as gl
import OpenGL.arrays.vbo as glvbo
import numpy
from numpy import diff, shape, sqrt, newaxis, zeros, isfinite, sum, linspace,apply_along_axis, log, arctan2, pi, isinf
import numpy.random
from scipy.signal import convolve, resample
from scipy.interpolate import interp1d

def delta(data):
    d = diff(data,axis=0) # 1 2 3 5 ==> 1 1 2
    filtered = convolve(d, [[0.5],[0.5]]) # 1 1 2 ==> 0.5 1 1.5 0.5
    return filtered

def normalize(data):
    d = data / sqrt((data ** 2).sum(-1))[..., newaxis]
    return d # Untested

def offset_array(data):
    # Array of alternating 1,-1. Useful for going from line width to
    # triangle offsets
    a = zeros(shape(data))
    a[::2,:] = 1
    a[1::2,:] = -1
    return a

def splineterpolate(single_axis_data, multiplier=5):
    sad = single_axis_data
    x = linspace(0, len(sad)-1,len(sad))
    f = interp1d(x, sad, kind='cubic')
    interpolated = f(linspace(0, len(sad)-1, len(sad)*5))
    return interpolated

class GLPlotWidget(QGLWidget):
    # default window size
    width, height = 1900, 900

    def __init__(self):
        QGLWidget.__init__(self)
        self.setMinimumSize(self.width, self.height)
        self.x = None
        self.y = None
        self.lines = []
        self.points = []
        self.timer = QtCore.QTimer()
        QtCore.QObject.connect(self.timer, 
                               QtCore.SIGNAL("timeout()"), 
                               self.repaint)
        self.timer.start(100)

    def begin_line(self, x,y,w=5):
        self.lines.append([[x,y,w]])

    def clean_line(self, line):
        resample = 'spline'
        # Denoise line
        # Interpolate more points
        if resample == 'fourier':
            line = resample(line, len(line)*5)
        elif resample == 'spline':
            line = apply_along_axis( splineterpolate, axis=0, arr=line )
        # Calculate width
        velocity = delta(line[:,:2])
        speed = sum(velocity**2, axis=1)**0.5
        angle = arctan2(velocity[:,1],velocity[:,0])
        angle = angle + 7*pi/4.
        angle = abs((angle % pi) - pi/2)
        width = (7-log(speed+0.1) + angle*2)**0.9
        
        line[:,2] = width
        #print shape(line)
        return line

    def end_line(self, x, y,w=5):
        self.extend_line(x,y,w)
        line = numpy.array(self.lines[-1])
        if len(line)<3:
            for point in line:
                self.points.append(point)
            self.lines.pop()
        elif len(line)>3:
            line = self.clean_line(line)
            self.lines[-1] = line
        #print(line)
        #print(shape(line))
        #print(len(line))

    def extend_line(self, x, y,w=5):
        if self.lines[-1][-1] and \
                x==self.lines[-1][-1][0] and \
                y==self.lines[-1][-1][1]:
            #print("skipping")
            return
        #print (self.lines[-1],x,y,w)
        self.lines[-1].append([x,y,w])

    def mousePressEvent(self, event):
        self.begin_line(x = event.x(), 
                        y = event.y())
        #self.repaint()

    def mouseReleaseEvent(self, event):
        self.end_line(x = event.x(), 
                      y = event.y())
        #self.repaint()

    def mouseMoveEvent(self, event):
        self.extend_line(x = event.x(), 
                         y = event.y())
        #self.repaint()
 
    def set_data(self, data):
        """Load 2D data as a Nx2 Numpy array.
        """
        self.data = data
        self.count = data.shape[0]
 
    def initializeGL(self):
        """Initialize OpenGL, VBOs, upload data on the GPU, etc.
        """
        # background color
        gl.glClearColor(0,0,0,0)
 
    def grid(self):
        big_step = 50
        little_step = 10
        gl.glPushAttrib(gl.GL_ENABLE_BIT); 
        # glPushAttrib is done to return everything to normal after drawing
        gl.glLineStipple(1, 65535);  # [1]
        gl.glEnable(gl.GL_LINE_STIPPLE);
        gl.glBegin(gl.GL_LINES);

        gl.glColor(0.969, 0.945, 0.75, 1.0) 
        for y in range(0,self.height, little_step):
            gl.glVertex(0,y);
            gl.glVertex(self.width,y);

        for x in range(0,self.width, little_step):
            gl.glVertex(x,0);
            gl.glVertex(x,self.height);

        gl.glColor(0.9375, 0.890625, 0.5, 1.0) 
        for y in range(0,self.height, big_step):
            gl.glVertex(0,y);
            gl.glVertex(self.width,y);

        for x in range(0,self.width, big_step):
            gl.glVertex(x,0);
            gl.glVertex(x,self.height);
        
        gl.glEnd();

        gl.glPopAttrib();

    def paintGL(self):
        """Paint the scene.
        """
        gl.glClearColor(0.988, 0.976, 0.878, 1.0) #252/249/224
        gl.glClear(gl.GL_COLOR_BUFFER_BIT)
        self.grid()
        gl.glColor(0.01176,0.023529,0.12157)
        gl.glEnableClientState(gl.GL_VERTEX_ARRAY)
        for line in self.lines:
            line = numpy.array(line)
            line_c = line[:,0:2]
            line_w = line[:,2]
            line_d = delta(line_c)
            line_o = normalize(line_d)[:,(1,0)]
            line_o[:,0] *= -1
            line_c = line_c + line_o*offset_array(line_o)*line_w[:,newaxis] #numpy.random.random_sample(shape(line_c))*4
#            print line_o
            valid = isfinite(sum(line_c, axis=1)) # Find NANs
            line_c = line_c[valid,:] # And kill them
            if len(line)<3:
                #print("This should never happen")
                continue
            #print("LINE",shape(line_c))
            gl.glVertexPointerf(line_c)
            gl.glDrawArrays(gl.GL_TRIANGLE_STRIP, 0, len(line))
        for point in self.points:
            p1 = point[:2]
            p2 = point[:2]
            p3 = point[:2]
            p1[0] -= point[2]
            p2[0] += point[2]*0.7
            p3[0] += point[2]*0.7
            p2[1] -= point[2]*0.7
            p3[1] += point[2]*0.7
            #print(p1,p2,p3)
            points =array([p1, p2, p3])
            #print("PTS",shape(points), points)
            gl.glVertexPointerf(points)
            gl.glDrawArrays(gl.GL_TRIANGLE_STRIP, 0, 3)
 
    def resizeGL(self, width, height):
        """Called upon window resizing: reinitialize the viewport.
        """
        self.width, self.height = width, height
        gl.glViewport(0, 0, width, height)
        gl.glMatrixMode(gl.GL_PROJECTION)
        gl.glLoadIdentity()
        gl.glOrtho(-1, 1, -1, 1, -1, 1)
        gl.glOrtho(0, self.width, self.height, 0, -1, 1)
 
if __name__ == '__main__':
    # import numpy for generating random data points
    import sys
    import numpy as np
    import numpy.random as rdn
 
    # define a QT window with an OpenGL widget inside it
    class TestWindow(QtGui.QMainWindow):
        def __init__(self):
            super(TestWindow, self).__init__()
            # generate random data points
            self.data = np.array(.2*rdn.randn(100000,2),dtype=np.float32)
            # initialize the GL widget
            self.widget = GLPlotWidget()
            self.widget.set_data(self.data)
            # put the window at the screen position (100, 100)
            self.setGeometry(100, 100, self.widget.width, self.widget.height)
            self.setCentralWidget(self.widget)
            self.show()
 
    # create the QT App and window
    app = QtGui.QApplication(sys.argv)
    window = TestWindow()
    window.show()
    app.exec_()
