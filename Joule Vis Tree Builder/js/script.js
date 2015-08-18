
$(document).ready(main);

var functionTree ={};
var plotLines = [];
var numLevels = 1; //No of meter arrays
var type = 0; //funtionTree or plotLines

function main(){
      /*Initialising Array*/

      console.log("Initialising...");
      InitialiseArray();
      console.log("Initialised");

      //Adding event listeners to buttons

      AddParent();
      RemoveParent();
      Next();
      Previous();
      FinishLevel();
      FinishTree();
      Type();
      MeterSearch();
      ReMarginPaginator();
      ConfigModal();
      ArrayNumBtn();
      AddDrag();

      $('#HelpHead').click(function(){$('#helpModal').modal('show')}); //Help button - can't be added in HTML as jquery hasn't loaded by then.

      //Allowing nodeName to show up on mouse hover and highlighting when selected 

      $('.drag').each(function(){
            DraggableHover($(this));
            HighlightDrag($(this));
      })

      /*Initial Drag and Drop Handling*/

      $('.drag').each(function(){
            $(this).data('pos',$(this).position());
      }).dblclick(function(){
            $('.selectedDrag').remove();
            console.log('Deleted');
      }) .draggable({
            cursor: 'move',
            revert: function(event,ui){
                        $(this).data("ui-draggable").originalPosition = {
                              top : $(this).data('pos').top,
                              left : $(this).data('pos').left
                        };    
                       
                        return !event;
                  },
            revertDuration: 400,
            zIndex: 100,
            disabled: false,
            helper:GroupDrags,
            drag: function(e, ui){
                        ui.helper.children().css('boxShadow','2px 2px 2px 2px');
                        ui.helper.css({
                				top: ui.position.top,
                				left: ui.position.left
            			})
                        
                  },
            stop: function(e,ui){
                       ui.helper.children().css('boxShadow','');
                       $('.selectedDrag').removeClass('selectedDrag');
        		  }
                  
           
      });

     $('.drop').droppable({
            accept: 'div.drag',
            drop: handleDrop
     });
  
};

//Drop function

function handleDrop(event,ui){
 
      
      $(this).append(ui.helper.children().clone(true).draggable().dblclick(function(){
            $('.selectedDrag').remove();
            console.log('Deleted');
      }));
     
      $('.drag').each(function(){$(this).removeClass('selectedDrag')});

      $(this).children('.ui-draggable').css('boxShadow','').find('span').remove(); //Remove hover display

     
        
};

//Groups many draggables into a container

function GroupDrags(){
           var container = $('<div style="background-color:transparent"></div>').attr('id','dragcontainer');

           $('.selectedDrag').each(function(){

            	$(this).clone(true).appendTo(container);
         
           })

           return container;
}

//Initialising spacings

function InitialiseArray(){
      var length = 6.0;
      var ArrayWidth = parseFloat($('.array').css("width"));

      var nmargin = .5*(ArrayWidth/length - 50);
      $('#Array'+ numLevels+' div').each(function(index){
            $(this).css("margin-left",nmargin-4);
            $(this).css("margin-right",nmargin-4);
      });      
};

//Button events

function AddParent(){
      var AddP = document.getElementById('AddParent');
    
      AddP.addEventListener('click',function(){
            var newP = '<button type="button" id="DelGrp" class="btn btn-danger btn-xs margin-custom">\
                              <p>Delete Group</p>\
                        </button>\
                        <button type="button" id="Done" class="btn btn-success btn-xs margin-custom">\
                              <p>Done</p>\
                        </button>\
                        <div class="stylecheck checkbox">\
                             <label>\
                                   <input type="checkbox" id="check" ><em> Master</em>\
                             </label>\
                        </div>';
            $('#TreeBuildBody').append('<div class="drop ui-droppable">' + newP + '</div>');
            $(document.getElementById('TreeBuildBody').lastChild).droppable({
                        accept: 'div.drag',
                        tolerance: 'touch',
                        drop: handleDrop
                  });
            //Add Done & DeleteGroup button event handlers to newP
            Done($(document.getElementById('TreeBuildBody').lastChild));
            DeleteGroup($(document.getElementById('TreeBuildBody').lastChild));
      },false);

};


function RemoveParent(){
      var RemP = document.getElementById('RemoveParent');

      RemP.addEventListener('click',function(){
           document.getElementById('TreeBuildBody').lastChild.remove();          
      },false);

};


function FinishLevel(){
      
      $('#FinishLevel').click(function(){
           ++numLevels;

           $('#TreeBuildBody div.drag').each(function(){
                 
                 if($('#Array'+numLevels).length === 0 && document.getElementById('Array'+(numLevels-1)).childElementCount !==0){
                       $('<div id="Array' + numLevels + '" class="well well-sm array"></div>').appendTo('#ArrayContainer');
                       $('li a.arrow-next').parent().before('<li><a href="#!" class="num">'+numLevels+'</a></li>');
                       ReMarginPaginator();
                       ArrayNumBtn();
                 }

                 
                 while(document.getElementById('Array'+(numLevels-1)).childElementCount === 0)
                       --numLevels;
                       
                 $(this).appendTo('#Array'+ numLevels);
    
           });

           //Rearrange Margins

           InitialiseArray();

           //Make revertable

           $('#Array'+numLevels+ ' div.drag').each(function(){
                 
                 console.log($(this));
                 $(this).draggable("option",{revert: function(event,ui){
                                          $(this).data("ui-draggable").originalPosition = {
                                                top : 0,
                                                left : 0
                                          };

                                          console.log($(this));  

                                          return !event;
                                          }
                                         
                                       }
                                   );
                        
           });      
      });   
};


function FinishTree(){
      $("#FinishTree").click(function(){
            functionTree = $('#Array2 div.drag').data('group');
            console.log(numLevels);
            alert("Tree built!");
            var funcTreeJSON = JSON.stringify({functionTree, plotLines: plotLines});

            console.log(funcTreeJSON);
            
            //Saving to file on computer
            
            var blob = new Blob([funcTreeJSON], {type: "text/json"});
            saveAs(blob, "mytree.json");
                      
      });
};

//Toggling between 'functionTree' and 'plotLines'

function Type(){
      $('#plotLines').click(function(){
            type = 'PLOTLINES';
            $('#plotLines').addClass('btn-primary');
            $('#functionTree').removeClass('btn-primary');
      })

      $('#functionTree').click(function(){
            type='FUNCTIONTREE';
            $('#functionTree').addClass('btn-primary');
            $('#plotLines').removeClass('btn-primary');
      })
}

//Droppable 'Done' Button

function Done(jobj){
     
     jobj.children("#Done").click(function(){

           if($(this).parent().children().length > 2){
                 
                 var meters = $(this).parent().children('.drag');
                
                 if(type === 'FUNCTIONTREE'){
                        
                        var children = [];
                     
                        //Adding nodeName and pLName for each meter
                          
                        meters.each(function(index){
                              var meterobj = {};
                              if($(meters[index]).is('[id]')){
				  var meterid = $(meters[index]).attr('id');

				  //Removing parts of 'id' that are redundant  

				  if(meterid.search('Ground') !== -1){
				      meterobj.nodeName = meterid = meterid.replace(' Ground','');
				      if(meterid.search('Lighting') !== -1)
					  meterobj.nodeName = meterid.replace(' Lighting','');
				      else if(meterid.search('Sockets') !== -1)
					  meterobj.nodeName = meterid.replace(' Sockets','');

				  }
				  else if(meterid.search('First') !== -1){
				      meterobj.nodeName = meterid = meterid.replace(' First','');
				      if(meterid.search('Lighting') !== -1)
					  meterobj.nodeName = meterid.replace(' Lighting','');
				      else if(meterid.search('Sockets') !== -1)
					  meterid.nodeName = meterid.replace(' Sockets','');

				  }
				  else if(meterid.search('Second') !== -1){
				      meterobj.nodeName = meterid = meterid.replace(' Second','');
				      if(meterid.search('Lighting') !== -1)
					  meterobj.nodeName = meterid.replace(' Lighting','');
				      else if(meterid.search('Sockets') !== -1)
					  meterobj.nodeName = meterid.replace(' Sockets','');
				  
				  }
				  else
                                      meterobj.nodeName = $(this).attr('id');


                                  meterobj.pLName = $(this).children('p').text();

                                  if($(meters[index]).is('[title]'))
                                        meterobj.description = $(this).attr('title');
                                    
                                  if($(meters[index]).is('[data-master]'))
                                        meterobj.master = $(this).attr('data-master') == 'true';
                              
                              }else{
                                    var group = $(this).data("group");
                                    meterobj.nodeName = group.nodeName;
                                    meterobj.pLName = group.pLName;
                                    meterobj.children = group.children;
				    group.description !== undefined ? meterobj.description = group.description : null;

                              }
                              
                              children[index] = meterobj;

			      //Inserting master object at beginning of array

			      if(meterobj.master){
				  for( i=0; i < index; i++){
				      var tempchildren = children;
				      children[i+1] = tempchildren[i];
				  }
				  
				  children[0] = meterobj;
			      }

                        }); 

                        //Creating the group draggable

                        var nodeName = prompt("Enter the group's 'nodeName'");
                        var pLName = prompt("Enter the group's 'pLName'");
                        var description = prompt("Enter the group's description (Leave empty if no description):");

		        if(pLName === "")pLName = null;

                        $(this).parent().children(".drag").detach();
                        $(this).parent().children(".btn").hide(); //Apparently you can't delete the button 'Done'
                        $(this).parent().children(".checkbox").hide();
                  
                        $(this).parent()
                               .removeClass("drop").removeClass("ui-droppable").addClass("drag")
                               .animate({
                                    width: "50px",
                                    height: "50px"
	                           },300)
	                           .append("<p>"+pLName+"</p>")
	                           .droppable({disabled: true})
	                           .draggable({
                                          cursor: 'move',                                  
                                          zIndex: 100,
                                          disabled: false,
                                          helper:GroupDrags,
                                          drag: function(e,ui){
                                                      ui.helper.children().css('boxShadow','2px 2px 2px 2px');
                                                      ui.helper.css({
                											top: ui.position.top,
                											left: ui.position.left
            										  });
                                                },
                                          stop: function(e,ui){
                                                      ui.helper.children().css('boxShadow','');
                                                      $('.drag').removeClass('selectedDrag');
                                                }
	                           })
	                           .dblclick(function(){
                                    $('.selectedDrag').remove();
                                    console.log('Deleted');
                               })
                               .data("group",{nodeName: nodeName, pLName: pLName, children: children});
                        
                        if($(this).parent().find('#check').prop('checked'))  //Checking if master is active
                              $(this).parent().data("group").master = true;

                        if(description !== '')
                              $(this).parent().data("group").description = description;
                  
                        DraggableHover($(this).parent()); //Make hovering available
                        HighlightDrag($(this).parent());

                 }else if(type === 'PLOTLINES'){

                       var components =[];

                       meters.each(function(index){
                             var meterobj={};
                             if($(meters[index]).is('[id]')){
                                    components[index] = $(this).children('p').text();
                             }else{
                                    var group = $(this).data("group");
                                    components[index] = group.pLName;
                             }

                       })

                       var pLName = prompt("Enter the group's 'pLName'");
                       var mode = prompt("Enter a mode(ALT,DIFF,SUM)");
                       var addtoPlotline = prompt("Add to 'plotLines'? (y/n)").toUpperCase();

                       $(this).parent().children(".drag").detach();
                       $(this).parent().children(".btn").hide();
                       $(this).parent().children(".checkbox").hide(); 
                  
                       $(this).parent()
                              .removeClass("drop").removeClass("ui-droppable").addClass("drag")
                              .animate({
                                   width: "50px",
                                   height: "50px"
	                          },300)
	                          .append("<p>"+pLName+"</p>")
	                          .droppable({disabled: true})
	                          .draggable({
                                         cursor: 'move',                                  
                                         zIndex: 100,
                                         disabled: false,
                                         helper:GroupDrags,
                                         drag: function(e,ui){
                                                ui.helper.children().css('boxShadow','2px 2px 2px 2px');
                                                ui.helper.css({
                										top: ui.position.top,
                										left: ui.position.left
            									});
                                               },
                                         stop: function(e,ui){
                                               ui.helper.children().css('boxShadow','');
                                               $('.selectedDrag').removeClass('selectedDrag')
                                         }
	                          })
	                          .dblclick(function(){
                                   $('.selectedDrag').remove();
                                   console.log('Deleted');
                              })
                              .data("group",{pLName: pLName, mode: mode, components: components});

		       //Incase we don't want some groups added to plotLines
                       if(addtoPlotline === 'Y')
                              plotLines.push($(this).parent().data('group'));
                      
                       DraggableHover($(this).parent());
                       HighlightDrag($(this).parent());

                 }else{
                       alert("Please select 'plotLines' or 'functionTree'");
                 }
                           
           }else{
                 alert("Add some meters!!");
           };
     });
};

function DeleteGroup(jobj){
      jobj.children("#DelGrp").click(function(){
            jobj.remove();
            console.log("Deleted");
      });
};

//Array Footer buttons

function Next(){
      $('.arrow-next').click(function(){

            var currentArray = $('.active-array');
            var nextArray = currentArray.next('.array');

            if(nextArray.length == 0){
                 nextArray = $('.array').first('.array');
            }

            currentArray.removeClass('active-array');
            nextArray.addClass('active-array');

            var currentDot = $('li a.active-num');
            var nextDot = currentDot.parent().next().children();

            if(nextDot.length == 0 || nextDot.is('.num') === false){
                  nextDot = $('.num').first();
            }

            currentDot.removeClass('active-num');
            nextDot.addClass('active-num');

      });
};

function Previous(){
      $('.arrow-prev').click(function(){

            var currentArray = $('.active-array');
            var prevArray = currentArray.prev('.array');

            if(prevArray.length == 0){
                 prevArray = $('.array').last('.array');
            }

            currentArray.removeClass('active-array');
            prevArray.addClass('active-array');

            var currentDot = $('li a.active-num');
            var prevDot = currentDot.parent().prev().children();

            if(prevDot.length == 0 || prevDot.is('.num') === false){
                  prevDot = $('.num').last();
            }

            currentDot.removeClass('active-num');
            prevDot.addClass('active-num');

      });
};


function ArrayNumBtn(){
      
      $('a.num').click(function(){
            
            var arraynum = parseInt($(this).text());

            var currentArray = $('.active-array');
            var newArray = $('#Array'+arraynum);

            currentArray.removeClass('active-array');
            newArray.addClass('active-array');

            var currentNum = $('.active-num');
            var newNum = $(this);

            currentNum.removeClass('active-num');
            newNum.addClass('active-num');
      });
};


function DraggableHover(jqobj){
      jqobj.mouseenter(
            function(){

                  if($(this).is('[id]'))
                        $(this).append($('<span style="z-index: 1000">' + $(this).attr('id')+'</span>'));
                  else if($(this).data('group').nodeName !== undefined)
                        $(this).append($('<span style="z-index: 1000">' + $(this).data('group').nodeName + '</span>'));
                  else
                        $(this).append($('<span style="z-index: 1000">' + $(this).data('group').pLName + '</span>'));
                  

            }).mouseleave(
                  function(){
                        $(this).find("span:last").fadeOut(100, function(){
                              $(this).find("span").remove();
                        });
                  
            });
};

//Search for individual meters (Only works for the meters and not groups)

function MeterSearch(){
      $('#Go').click(function(){
            var text = $('#ArrayContainer input').val();

            $('.drag').each(function(){
                  $(this).show();

                  if($(this).attr('id').search(text) === -1)
                        $(this).hide();
            })

            
      })
};

//Centering paginator at array footer

function ReMarginPaginator(){
      if(numLevels > 1)
                 $('ul.pagination').css('width', "+=28.6875");

      var paginatorwidth = parseFloat($('.pagination').css("width"));
      var footerwidth = parseFloat($('#ArrayFooter').css('width'));

      var margin = (footerwidth-paginatorwidth)/2.0;

      $('ul.pagination').css('margin-left',margin)
                        .css('margin-right',margin);
                        
};

//Configuration button

function ConfigModal(){
      $('#configModal').on('show.bs.modal',function(e){
            $('input#zeroDate').datetimepicker({
                  "format" : "MMM DD YYYY HH:mm:ss"
            });
      });

      $('#tfile').change(function (evt) {
			var files = evt.target.files; // FileList object

			for (var i = 0, f; f = files[i]; i++) {

	  		// Only process json files
	  			if (!f.type.match('application.json')) {
	    			continue;
	  			}

	  			var reader = new FileReader();

	  			// Closure to capture the file information.
	  			reader.onload = (function(theFile) {
	    			return function(e) {
	      	  	 	console.log(e.target.result); //URL for uploaded file
	      	  	 	$('#treeUrl').val(e.target.result);
	                }
	  			})(f);

	  			// Read in the json file as a data URL.
	  			reader.readAsDataURL(f);

			    console.log(reader);
				
			}
	  });

      $('button#FinishConfig').click(function(){

            var config ={
                  maxNumberPlots: { description: $('label[for=maxNumberPlots]').attr("title"), value: $('input#maxNumberPlots').val()},
                  defaultChart: {description: $('label[for=defaultChart]').attr('title'), value: $('input#defaultChart').val()},
                  segmentation: {description: $('label[for=segmentation]').attr('title'), value: $('input#segmentation').val()},
                  autoFilter: {description: $('label[for=autoFilter]').attr('title'), value:{maxY: $('input#maxY').val(), minY: $('input#minY').val()}},
                  zeroDate: {description: $('label[for=zeroDate]').attr('title'), value: $('input#zeroDate').val()},
                  zoomSize: {description: $('label[for=zoomSize]').attr('title'), value: {zoomX: $('input#zoomX').val(), zoomDX: $('input#zoomDX').val()}},
                  treeUrl: {description: $('label[for=treeUrl]').attr('title'), value: $('input#treeUrl').val()},
                  sensorRootUrl: {description: $('label[for=sensorRootUrl]').attr('title'), value: $('input#sensorRootUrl').val()},
                  carbonRootUrl: {description: $('label[for=carbonRootUrl]').attr('title'), value: $('input#carbonRootUrl').val()}

                 };

            var configJSON = JSON.stringify({config});

            var blob = new Blob([configJSON], {type: "text/json"});
            saveAs(blob, "myconfig.json");

            $('#configModal').trigger('hide.bs.modal')
      });      
};

function AddDrag(){
      $('div#AddDrag').click(function(){

            var nodeName = prompt("Enter nodeName:");
            var pLName = prompt("Enter pLName:");
            var description = prompt("Enter a description:");
            var master = prompt("Master?(true/false):").toLowerCase();
            var master_bool = (master == 'true');

            console.log(typeof master_bool);

            var newdrag = '<div id="'+ nodeName + '" class="drag" ><p>'+pLName+'</p></div>';

            $('div#AddDrag').before(newdrag);

            if(master_bool) $('#Array1 div.drag:last').attr('data-master',master_bool);

            if(description !== '') $('#Array1 div.drag:last').attr('title', description);

            InitialiseArray();

            $('#Array1 div.drag:last').draggable({
                                                cursor: 'move',                                  
                                                zIndex: 100,
                                                disabled: false,
                                                revert: function(event,ui){
                                                      $(this).data("ui-draggable").originalPosition = {
                                                            top : 0,
                                                            left : 0
                                                      };  

                                                      return !event;
                                                },
                                                helper:GroupDrags,
                                                drag: function(e,ui){
                                                            ui.helper.children().css('boxShadow','2px 2px 2px 2px');
                                                           	ui.helper.css({
                													top: ui.position.top,
                													left: ui.position.left
            												});
                                                },
                                                stop: function(e,ui){
                                                      ui.helper.children().css('boxShadow','');
                                                      $('.selectedDrag').removeClass('selectedDrag')
                                                }
	                                   })
	                                   .dblclick(function(){
                                          $('.selectedDrag').remove();
                                          console.log('Deleted');
                                       })

            DraggableHover($('#Array1 div.drag:last'));
            HighlightDrag($('#Array1 div.drag:last'));

            console.log($('#Array1 div.drag:last'));
      })
}

function HighlightDrag(jobj){
	 
	 var selectedClass = 'selectedDrag',
        clickDelay = 600,
        // click time (milliseconds)
        lastClick, diffClick; // timestamps

	 $(jobj).bind('mousedown mouseup', function(e) {
        if (e.type == "mousedown") {
            lastClick = e.timeStamp; // get mousedown time
        } else {
            diffClick = e.timeStamp - lastClick;
            if (diffClick < clickDelay) {
                // add selected class to group draggable objects
                $(this).toggleClass(selectedClass);
            }
        }
    })
}

