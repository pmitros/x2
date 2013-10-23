Support Models
==============

Static TAs
----------

The course has dedicated TAs. These are either identified
superstudents, or actual course staff.

Peers
-----

The system connects peers (either at random, or working on a common
problem).

Dynamic TAs 
-----------

The system identifies potential TAs based on what students know. In
version 1, if a student finishes a problem, they are assumed to be
qualified to help with that problem. In 2, we can have richer models. 


UX Models
=========

Interrupt model
---------------

Students can request help. When a student requests help, another
student is flagged down to provide it. That student has 20 seconds to
respond.

Control model
-------------

There is a pool of TAs and a pool of students. TAs have a page where
they can help students. When a student requests help, they are
connected to an the next available TA. There is an expected wait time
(shown to student). If the expected wait time goes above some
duration, the system attempts to recruit more TAs.

Next Available Model
--------------------

A student can request help on a question. That student is shown
automated help resources until help becomes available. When another
student who has successfully finished that question, and who has
agreed to participate, either logs in, finishes a question, or is in
another between-task state, that student is automatically brought into
the chat room.

Common Conversation
-------------------

Each problem has a pool of chatrooms associated with it. When a
student requests help, they are connected to a chatroom. If all the
chat rooms are full, a new room is created. 


Key questions
=============

#.  How many people working on the same resource are on-line at the same time? 
#.  If we want to peer someone who just finished a problem with
 someone who just started it, what is the typical delay?
#.  What is the overhead for interrupting a student? 
#.  Will students want to help? How do we structure incentives? 
#.  What analytics can be extracted from sessions? Can we get at
 common issues/misconceptions?
#.  Will student prefer to work in-line, semi-in-line, or in a dedicated page? 
