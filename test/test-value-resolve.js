"use strict";
var QUnit = require("steal-qunit");
require("can-define/list/list");
var DefineMap = require("can-define/map/map");
var canReflect = require("can-reflect");
var queues = require("can-queues");

// Tests events directly on the Constructor function for define.Constructor, DefineMap and DefineList
QUnit.module("can-define value with resolve");

QUnit.test("counter", function(){
    var Person = DefineMap.extend("Person", {
        name: "string",
        nameChangeCount: {
            value: function(prop){
                var count = 0;
                prop.resolve(count);
                prop.listenTo("name", function(){
                    prop.resolve(++count);
                });
            }
        }
    });

    var me = new Person();
    QUnit.equal(me.nameChangeCount,0, "unbound value");

    me.name = "first";

    QUnit.equal(me.nameChangeCount,0, "unbound value");

    me.on("nameChangeCount", function(ev, newVal, oldVal){
        QUnit.equal(newVal,1, "updated count");
        QUnit.equal(oldVal,0, "updated count from old value");
    });

    me.name = "second";

    QUnit.equal(me.nameChangeCount,1, "bound value");
});

QUnit.test("fullName getter the hard way", 3, function(){
    var Person = DefineMap.extend("Person", {
        first: "string",
        last: "string",
        fullName: {
            value: function(prop){
                var first = this.first,
                    last = this.last;
                prop.resolve(first + " " + last);
                prop.listenTo("first", function(ev, newFirst){
                    first = newFirst;
                    prop.resolve(first + " " + last);
                });
                prop.listenTo("last", function(ev, newLast){
                    last = newLast;
                    prop.resolve(first + " " + last);
                });
            }
        }
    });
    var me = new Person({first:"Justin", last: "Meyer"});

    QUnit.equal(me.fullName, "Justin Meyer", "unbound value");

    var handler = function(ev, newVal, oldVal){
        QUnit.equal(newVal, "Ramiya Meyer", "event newVal");
        QUnit.equal(oldVal, "Justin Meyer", "event oldVal");
    };

    me.on("fullName", handler);

    me.first = "Ramiya";

    me.off("fullName", handler);

    me.last = "Shah";
});

QUnit.test("list length", function(){
    var VM = DefineMap.extend("VM", {
        tasks: [],
        tasksLength: {
            value: function(prop){
                var tasks;
                function checkAndResolve(){
                    if(tasks) {
                        prop.resolve(tasks.length);
                    } else {
                        prop.resolve(0);
                    }
                }
                function updateTask(ev, newTask, oldTask) {
                    if(oldTask) {
                        prop.stopListening(oldTask);
                    }
                    tasks = newTask;
                    if(newTask) {
                        prop.listenTo(newTask,"length", function(ev, newVal){
                            prop.resolve(newVal);
                        });
                    }

                    checkAndResolve();
                }

                prop.listenTo("tasks", updateTask);

                updateTask(null, this.tasks, null);
            }
        }
    });

    var vm = new VM({tasks: null});

    QUnit.equal(vm.tasksLength, 0, "empty tasks, unbound");

    vm.tasks = ["chore 1", "chore 2"];

    QUnit.equal(vm.tasksLength, 2, "tasks, unbound");
    var lengths = [];
    vm.on("tasksLength", function(ev, newLength){
        lengths.push(newLength);
    });

    QUnit.equal(vm.tasksLength, 2, "2 tasks, bound");

    vm.tasks.push("chore 3");

    var originalTasks = vm.tasks;

    QUnit.equal(vm.tasksLength, 3, "3 tasks, bound, after push to source");

    vm.tasks = ["one chore"];

    QUnit.equal(vm.tasksLength, 1, "1 tasks, bound, after replace array");

    QUnit.notOk( canReflect.isBound(originalTasks), "not bound on original");


    QUnit.deepEqual(lengths, [3, 1], "length changes are right");
});

QUnit.test("batches produce one result", 2, function(){
    var Person = DefineMap.extend("Person", {
        first: "string",
        last: "string",
        fullName: {
            value: function(prop){
                var first = this.first,
                    last = this.last;
                prop.resolve(first + " " + last);
                prop.listenTo("first", function(ev, newFirst){
                    first = newFirst;
                    prop.resolve(first + " " + last);
                });
                prop.listenTo("last", function(ev, newLast){
                    last = newLast;
                    prop.resolve(first + " " + last);
                });
            }
        }
    });

    var me = new Person({first:"Justin", last: "Meyer"});

    var handler = function(ev, newVal, oldVal){
        QUnit.equal(newVal, "Ramiya Shah", "event newVal");
        QUnit.equal(oldVal, "Justin Meyer", "event oldVal");
    };

    me.on("fullName", handler);

    queues.batch.start();
    me.first = "Ramiya";
    me.last = "Shah";
    queues.batch.stop();
});

QUnit.test("location vm", function(){
    var Locator = DefineMap.extend("Locator",{
    	state: "string",
        setCity: function(city){
            this.dispatch("citySet",city);
        },
    	city: {
            value: function(prop) {
                prop.listenTo("citySet", function(ev, city){
                    prop.resolve(city);
                });
                prop.listenTo("state", function(){
                    prop.resolve(null);
                });
            }
        }
    });

    var locator = new Locator({
    	state: "IL"
    });
    locator.on("city", function(){});

    locator.setCity("Chicago");

    locator.state = "CA";
    QUnit.equal(locator.city, null, "changing the state sets the city");

});

QUnit.test("location vm with setter", function(){
    var Locator = DefineMap.extend("Locator",{
    	state: "string",
    	city: {
            value: function(prop) {
                prop.listenTo(prop.lastSet, prop.resolve);
                prop.listenTo("state", function(){
                    prop.resolve(null);
                });
                prop.resolve( prop.lastSet.get() );
            }
        }
    });

    var locator = new Locator({
    	state: "IL",
        city: "Chicago"
    });
    QUnit.equal(locator.city, "Chicago", "init to Chicago");

    locator.on("city", function(){});

    locator.state = "CA";
    QUnit.equal(locator.city, null, "changing the state sets the city");

    locator.city = "San Jose";

    QUnit.equal(locator.city, "San Jose", "changing the state sets the city");

});

/*
QUnit.test("fullName getter/setter the hard way", 3, function(){
    var Person = DefineMap.extend("Person", {
        first: {
            value: function(resolve, listenTo){
                listenTo("firstSet", function(ev, newVal){
                    resolve(newVal);
                });
                listenTo("fullNameSet", function(ev, newVal){
                    var parts = newVal.split(" ");
                    resolve(parts[0]);
                });
            }
        },
        last: {
            value: function(resolve, listenTo){
                listenTo("firstSet", function(ev, newVal){
                    resolve(newVal);
                });
                listenTo("fullNameSet", function(ev, newVal){
                    var parts = newVal.split(" ");
                    resolve(parts[0]);
                });
            }
        },
        fullName: {
            value: function(resolve, listenTo){
                var first = this.first,
                    last = this.last;
                resolve(first + " " + last);
                listenTo("first", function(ev, newFirst){
                    first = newFirst;
                    resolve(first + " " + last);
                });
                listenTo("last", function(ev, newLast){
                    last = newLast;
                    resolve(first + " " + last);
                });
            }
        }
    });
    var me = new Person({first:"Justin", last: "Meyer"});

    QUnit.equal(me.fullName, "Justin Meyer", "unbound value");

    var handler = function(ev, newVal, oldVal){
        QUnit.equal(newVal, "Ramiya Meyer", "event newVal");
        QUnit.equal(oldVal, "Justin Meyer", "event oldVal");
    };

    me.on("fullName", handler);

    me.first = "Ramiya";

    me.off("fullName", handler);

    me.last = "Shah";
});
*/
