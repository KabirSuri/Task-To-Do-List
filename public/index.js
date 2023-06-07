let tasks = [];
let updatingTaskID=-1;
let numOfCompleted=0;
let hideCompletedTask=false;
let overDueOnlyFlag=false;

function truncate(input, number) {
   if (input.length > number)
      return input.substring(0,number) + '...';
   else
      return input;
};

function getFormattedDate(date) {
  if(date == null){
    return "";
  }
  var year = date.getFullYear();
  var month = (1+date.getMonth()).toString();
  month = month.length > 1 ? month : '0' + month;
  var day = date.getDate().toString();
  day = day.length > 1 ? day : '0' + day;
  return month + '/' + day + '/' + year;
}

function taskDelete(index){
  let task=tasks[index];
  task.deleted=true;
  let data={_id:task._id,title: task.title,dueDate: task.dueDate,completed: task.completed,completeDate: task.completeDate,createdDate: task.createdDate,deleted: task.deleted,note: task.note};
  $.post("./deletetask",data);
}

// date we get from server is string. This is to change the string to Date object
let reviveDate = function(strDate){
  if(strDate == null)
    return null;
  let dateObj = new Date(strDate);
  if (isNaN(dateObj.getTime()))
  {
    dateObj = null;
  }
  return dateObj;
}

let renderHTML = function(index){
  //console.log("43");
  task=tasks[index];
  let todoitem_call= "";
  let title=truncate(task.title,30);
  let checked="";
  let tr_class="";
  let completeDate=getFormattedDate(task.completeDate);
  let dueDate=getFormattedDate(task.dueDate);
  let uri="href=mailto:?body="+tasks[index].note+"&subject="+tasks[index].title;

  if(task.completed){
    title="<del>"+title+"</del>";
    checked="checked";
    tr_class+="success";
  }
  else{
    if(task.dueDate<new Date() && task.dueDate!=null){
      tr_class+="danger";
    }
  }

  let renderedHTML = '\
  <tr id="'+index+'" class="'+tr_class+'">\
    <td class="text-center"><input type="checkbox" class="form-check-input" value="'+index+'" '+checked+'></td>\
    <td class="text-center">'+title+'</td>\
    <td class="text-center"><span class="text-right"><button class="btn btn-xs btn-warning" data-toggle="collapse" data-target="#note-'+index+'"><span class="glyphicon glyphicon-triangle-bottom"> </span> Note</button></span></td>\
    <td class="text-center">'+dueDate+'</td>\
    <td class="text-center">'+completeDate+'</td>\
    <td class="text-center">\
      <button type="button" class="btn btn-warning btn-xs updatetask" alt="Update the task" value="'+index+'"><span class="glyphicon glyphicon-pencil"></span></button>\
      <button type="button" class="btn btn-danger btn-xs deletetask" alt="Delete the task" value="'+index+'"><span class="glyphicon glyphicon-trash"></span></button>\
      <a target="_blank" '+encodeURI(uri)+'"><button type="button" class="btn btn-danger btn-xs emailtask" alt="Send an email" value="0"><span class="glyphicon glyphicon-envelope"></span></button></a>\
    </td>\
  </tr>\
  <tr id="note-'+index+'" class="collapse">\
    <td></td>\
    <td colspan="5&quot;">\
      <div class="well">\
        <h3>\
          '+tasks[index].title+'\
        </h3>\
        <h4> Due Date: '+dueDate+'</h4>\
        <div>\
          '+tasks[index].note.replace(/\r\n|\r|\n/g,"<br/>")+'\
        </div>\
      </div>\
    </td>\
  </tr>';

  return renderedHTML;
}

let renderTasks =function(){
  // TODO redner all HTML elements based on the current tasks object.
  // Add event handlers for checkboxes, delete button, and udpate button.
  // using for loop is recommended over using forEach function so that you can use array index.
  // note that renderHTML takes index as its only parameter.
  $("tbody").empty();
  let Now=new Date();
  numOfCompleted=0;
  //console.log(tasks);
  for(let i=0;i<tasks.length;i++){
    //console.log("i:"+i);
    //console.log("dueDate:"+tasks[i].dueDate);
    if(hideCompletedTask && tasks[i].completed)continue;
    if(overDueOnlyFlag && (tasks[i].dueDate==null|| tasks[i].dueDate>Now || tasks[i].completed))continue;
    if(!hideCompletedTask && tasks[i].completed){
      numOfCompleted++;
    }
    $('tbody').append(renderHTML(i));
  }

  $(".form-check-input").change(function(){
    task=tasks[this.value];
    task.completed=!task.completed;

    if(task.completed){
      task.completeDate=new Date();
      numOfCompleted++;
    }
    else{
      task.completeDate=null;
      numOfCompleted--;
    }
    //console.log("test");
    let data={title: task.title,dueDate:task.dueDate,completed: task.completed,completeDate: task.completeDate,note:task.note};
    $.post("./updatetask",body={_id:task._id,data});
    fetchData();
  });

  if(numOfCompleted>0){
    //console.log("abled");
    $("#deleteCompletedTasks").prop("disabled", false);
  }
  else if(numOfCompleted==0){
    $("#deleteCompletedTasks").prop("disabled",true);
  }

  $(".deletetask").click(function(){
    if(!confirm("Are you sure?"))return;
    taskDelete(this.value);
    //console.log("TEST");
    fetchData();
  });

  $(".updatetask").click(function(event){
    //console.log("Test");
    $("#myUpdateTaskModal").modal();
    updatingTaskID=this.value;
    task=tasks[updatingTaskID];
    $("#update-due-date").val(getFormattedDate(task.dueDate));
    $("#update-task-title").val(task.title);
    $("#update-task-note").val(task.note);
  });

  $(".emailtask").click(function(event){
    //console.log("Test");
  });

};

let fetchData = function(){
  // TODO replace tasks (line 1) objects with the ones from the server response.
  // make sure that you use reviveDate to convert string to Date object.
  $.get('./fetchtasks',function(data, status, obj){
    tasks=data.data;
    for(let i=0;i<tasks.length;i++){
      if(tasks[i].dueDate!="")tasks[i].dueDate=reviveDate(tasks[i].dueDate);
      else tasks[i].dueDate=null;
      if(tasks[i].completeDate!="")tasks[i].completeDate=reviveDate(tasks[i].completeDate);
      else tasks[i].completeDate=null;
    }
    //console.log(tasks);
    renderTasks();
  });
}

$(document).ready(function(){
  fetchData();

  $("#deleteCompletedTasks").click(function(){
    let count=0;
    $(tasks).each(function(index, element){
      if(element.completed&&!element.deleted){
        count++;
      }
    });
    let statement="Do you want to delete 1 task?";
    if(count>1)statement="Do you want to delete "+count+" tasks?";
    if(confirm(statement)){
      for(let i=0;i<tasks.length;i++){
        if(tasks[i].completed)taskDelete(i);
      }
    }
    fetchData();
  });

  $('#overdue').click(function(){
    if($(this).attr("class")!="active")$(this).attr("class","active");
    else $(this).attr("class","");
    overDueOnlyFlag=!overDueOnlyFlag;
    renderTasks();
  });

  $('#hidecompleted').click(function(){
    hideCompletedTask=!hideCompletedTask;
    renderTasks();
  });

  $("#updateTask").click(function(event){
    task=tasks[updatingTaskID];
    if($("#update-task-title").val()==""){
      alert("Please enter a title");
      return;
    }
    if($("#update-due-date").val()!=""&&Number.isNaN(Date.parse($("#update-due-date").val()))){
      alert("Check your date format");
      return;
    }
    let date = new Date(Date.parse($("#update-due-date").val()));
    if($("#update-due-date").val()=="")date=null;
    let data={title: $("#update-task-title").val(),dueDate: date,completed: task.completed,completeDate: task.completeDate,createdDate: task.createdDate,deleted:task.deleted,note:$("#update-task-note").val()};
    $("#update-due-date").val('');
    $("#update-task-title").val('');
    $("#update-task-note").val('');
    $("#myUpdateTaskModal").modal("hide");
    $.post("./updatetask",body={_id:task._id,data});
    updatingTaskID=-1;
    fetchData();
  });

  $("#submitNewTask").click(function( event ) {
    //event.preventDefault();
    if($("#task-title").val()==""){
      alert("Please enter a title");
      return;
    }
    if($("#due-date").val()!=""&&Number.isNaN(Date.parse($("#due-date").val()))){
      alert("Check your date format");
      return;
    }
    let date = new Date(Date.parse($("#due-date").val()));
    if($("#due-date").val()=="")date=null;
    let data={title: $("#task-title").val(),dueDate: date,completed: false,completeDate: null,createdDate: new Date(),deleted:false,note:$("#task-note").val()};
    $.post("./newtask",data);
    $("#due-date").val('');
    $("#task-title").val('');
    $("#task-note").val('');
    $("#myNewTaskModal").modal("hide");
    fetchData();
  });

  $(".addtask").click(function(){
    $("#myNewTaskModal").modal();
  });

  $("#refresh").click(function(){
    fetchData();
  });

});
