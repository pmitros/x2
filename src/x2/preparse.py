import json

s = json.load(open("instructor-datadump.json"))

courses = {}
students = {}
instructors = {}
sessions = {}
tables = {}
interactions = {}
agents = {}


def foo(*args, **kwargs):
    print args, kwargs

new_course= foo
new_student= foo
new_instructor= foo
new_session = foo

for element in s:
    if element["model"] == "instructor.course":
        print new_course()#slug=element["slug"], 
                         #name=element["name"])
    elif element["model"] == "instructor.student":
        print new_student(name ="bob")# [e["fields"]["name"] for e in s if e["pk"] = element["pk"] and e["model"] = "instructor.agent" ][0])
    elif element["model"] == "instructor.instructor":
        print new_instructor(name = "bob") # [e["fields"]["name"] for e in s if e["pk"] = element["pk"] and e["model"] = "instructor.agent" ][0])
    elif element["model"] == "instructor.sessionstudentdata":
        print new_session()
    elif element["model"] == "instructor.tableblock":
        pass
    elif element["model"] == "instructor.interaction":
        pass

