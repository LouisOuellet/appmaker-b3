API.Plugins.b3 = {
	init:function(){
		API.GUI.Sidebar.Nav.add('b3', 'main_navigation');
		var nav = $('ul.nav-sidebar').find('a[href="?p=b3"]').parent();
		var html = '<ul class="nav nav-treeview"></ul>';
		nav.append(html);
		var sub = nav.fin('ul');
		sub.append('<li class="nav-item"><a href="?p=my_b3" class="nav-link"><i class="far fa-circle nav-icon"></i><p>My B3</p></a></li>');
	},
	load:{
		index:function(){
			API.Builder.card($('#pagecontent'),{ title: 'b3', icon: 'b3'}, function(card){
				API.request('b3','read',{
					data:{options:{ link_to:'b3Index',plugin:'b3',view:'index' }},
				},function(result) {
					var dataset = JSON.parse(result);
					if(dataset.success != undefined){
						for(const [key, value] of Object.entries(dataset.output.dom)){ API.Helper.set(API.Contents,['data','dom','b3',value.id],value); }
						for(const [key, value] of Object.entries(dataset.output.raw)){ API.Helper.set(API.Contents,['data','raw','b3',value.id],value); }
						API.Builder.table(card.children('.card-body'),dataset.output.dom,{
							headers:['transaction_number','invoice_number','status','b3_client_code','client_sbrn','cargo_control_number','customs_office','location_of_goods','container_numbers','mwb','num_pkg','gross_weight','vendor_code','po_num','ci_number'],
							id:'b3Index',
							modal:true,
							key:'transaction_number',
							clickable:{ enable:true, view:'details'},
							controls:{ toolbar:true},
							import:{ key:'id', },
							load:false,
						},function(response){});
					}
				});
			});
		},
		details:function(){
			var container = $('div[data-plugin="b3"][data-id]').last();
			var url = new URL(window.location.href);
			var id = url.searchParams.get("id");
			API.request(url.searchParams.get("p"),'get',{data:{id:id,key:'transaction_number'}},function(result){
				var dataset = JSON.parse(result);
				if(dataset.success != undefined){
					container.attr('data-id',dataset.output.this.raw.id);
					// GUI
					// Adding Layout
					bgImage = '/plugins/b3/dist/img/clearance.png';
					API.GUI.Layouts.details.build(dataset.output,container,{title:"B3 Details",image:bgImage},function(data,layout){
						if(layout.main.parents().eq(2).parent('.modal-body').length > 0){
							var modal = layout.main.parents().eq(2).parent('.modal-body').parents().eq(2);
							if(API.Auth.validate('plugin', 'b3', 3)){
								modal.find('.modal-header').find('.btn-group').find('[data-control="update"]').off().click(function(){
									API.CRUD.update.show({ container:layout.main.parents().eq(2), keys:data.this.raw });
								});
							} else {
								modal.find('.modal-header').find('.btn-group').find('[data-control="update"]').remove();
							}
						}
						// History
						API.GUI.Layouts.details.tab(data,layout,{icon:"fas fa-history",text:API.Contents.Language["History"]},function(data,layout,tab,content){
							API.Helper.set(API.Contents,['layouts','b3',data.this.raw.id,layout.main.attr('id')],layout);
							content.addClass('p-3');
							content.append('<div class="timeline" data-plugin="b3"></div>');
							layout.timeline = content.find('div.timeline');
							var today = new Date();
							API.Builder.Timeline.add.date(layout.timeline,today);
							layout.timeline.find('.time-label').first().html('<div class="btn-group"></div>');
							layout.timeline.find('.time-label').first().find('div.btn-group').append('<button class="btn btn-primary" data-trigger="all">'+API.Contents.Language['All']+'</button>');
							var options = {plugin:"b3"}
							// Debug
							if(API.debug){
								API.GUI.Layouts.details.button(data,layout,{icon:"fas fa-stethoscope"},function(data,layout,button){
									button.off().click(function(){
										console.log(data);
										console.log(layout);
									});
								});
							}
							// Clear
							if(API.Auth.validate('custom', 'b3_clear', 1)){
								API.GUI.Layouts.details.control(data,layout,{color:"danger",icon:"fas fa-snowplow",text:API.Contents.Language["Clear"]},function(data,layout,button){
									button.off().click(function(){
										API.request('b3','clear',{ data:data.this.raw },function(){
											API.Plugins.b3.load.details();
										});
									});
								});
							}
							// Review
							if(API.Auth.validate('custom', 'b3_review', 1)){
								API.GUI.Layouts.details.control(data,layout,{color:"success",icon:"fas fa-search-location",text:API.Contents.Language["Review"]},function(data,layout,button){
									button.off().click(function(){
										API.Plugins.b3.review(data,layout);
									});
								});
							}
							// Transaction Number
							API.GUI.Layouts.details.data(data,layout,{field:"transaction_number"});
							// Billing Invoice Number
							API.GUI.Layouts.details.data(data,layout,{field:"invoice_number"});
							// Status
							if(API.Helper.isSet(API.Plugins,['statuses']) && API.Auth.validate('custom', 'b3_statuses', 1)){
								API.Plugins.statuses.Layouts.details.detail(data,layout);
							}
							// Organizations
							if(API.Helper.isSet(API.Plugins,['organizations']) && API.Auth.validate('custom', 'b3_organizations', 1)){
								API.Plugins.organizations.Layouts.details.detail(data,layout);
							}
							// Client
							API.GUI.Layouts.details.data(data,layout,{field:"b3_client_code"});
							// SBRN
							API.GUI.Layouts.details.data(data,layout,{field:"client_sbrn"});
							// Cargo Control Number
							API.GUI.Layouts.details.data(data,layout,{field:"cargo_control_number"});
							// Customs Office
							API.GUI.Layouts.details.data(data,layout,{field:"customs_office"});
							// Sub Location
							API.GUI.Layouts.details.data(data,layout,{field:"location_of_goods"});
							// Master WayBill
							API.GUI.Layouts.details.data(data,layout,{field:"mwb"});
							// Container Number(s)
							API.GUI.Layouts.details.data(data,layout,{field:"container_numbers"});
							// Vendor
							API.GUI.Layouts.details.data(data,layout,{field:"vendor_code"});
							// Purchase Order
							API.GUI.Layouts.details.data(data,layout,{field:"po_num"});
							// Invoice Number
							API.GUI.Layouts.details.data(data,layout,{field:"ci_num"});
							// Number of Packages
							API.GUI.Layouts.details.data(data,layout,{field:"num_pkg"});
							// Weight
							API.GUI.Layouts.details.data(data,layout,{field:"gross_weight"});
							// Notes
							if(API.Helper.isSet(API.Plugins,['notes']) && API.Auth.validate('custom', 'b3_notes', 1)){
								API.Plugins.notes.Layouts.details.tab(data,layout);
							}
							// Contacts
							if(API.Helper.isSet(API.Plugins,['contacts']) && API.Auth.validate('custom', 'b3_contacts', 1)){
								API.Plugins.contacts.Layouts.details.tab(data,layout);
							}
							// Files
							if(API.Helper.isSet(API.Plugins,['files']) && API.Auth.validate('custom', 'conversations_files', 1)){
								API.Plugins.files.Layouts.details.tab(data,layout);
							}
							// Created
							options.field = "created";
							options.td = '<td><time class="timeago" datetime="'+data.this.raw.created.replace(/ /g, "T")+'" title="'+data.this.raw.created+'">'+data.this.raw.created+'</time></td>';
							API.GUI.Layouts.details.data(data,layout,options,function(data,layout,tr){ tr.find('time').timeago(); });
							// Subscription
							var icon = "fas fa-bell";
							if(API.Helper.isSet(data,['relations','users',API.Contents.Auth.User.id])){ var icon = "fas fa-bell-slash"; }
							API.GUI.Layouts.details.button(data,layout,{icon:icon},function(data,layout,button){
								button.off().click(function(){
									if(button.find('i').hasClass( "fa-bell" )){
										button.find('i').removeClass("fa-bell").addClass("fa-bell-slash");
										API.request("b3",'subscribe',{data:{id:data.this.raw.id}},function(answer){
											var subscription = JSON.parse(answer);
											if(subscription.success != undefined){
												var sub = {};
												for(var [key, value] of Object.entries(API.Contents.Auth.User)){ sub[key] = value; }
												sub.created = subscription.output.relationship.created;
												sub.name = '';
												if((sub.first_name != '')&&(sub.first_name != null)){ if(sub.name != ''){sub.name += ' ';} sub.name += sub.first_name; }
												if((sub.middle_name != '')&&(sub.middle_name != null)){ if(sub.name != ''){sub.name += ' ';} sub.name += sub.middle_name; }
												if((sub.last_name != '')&&(sub.last_name != null)){ if(sub.name != ''){sub.name += ' ';} sub.name += sub.last_name; }
												API.Builder.Timeline.add.subscription(layout.timeline,sub,'bell','lightblue',function(item){
													if((API.Auth.validate('plugin','users',1))&&(API.Auth.validate('view','details',1,'users'))){
														item.find('i').first().addClass('pointer');
														item.find('i').first().off().click(function(){
															API.CRUD.read.show({ key:'username',keys:data.relations.users[item.attr('data-id')], href:"?p=users&v=details&id="+data.relations.users[item.attr('data-id')].username, modal:true });
														});
													}
												});
											}
										});
									} else {
										button.find('i').removeClass("fa-bell-slash").addClass("fa-bell");
										API.request(url.searchParams.get("p"),'unsubscribe',{data:{id:dataset.output.this.raw.id}},function(answer){
											var subscription = JSON.parse(answer);
											if(subscription.success != undefined){
												layout.timeline.find('[data-type="bell"][data-id="'+API.Contents.Auth.User.id+'"]').remove();
											}
										});
									}
								});
							});
							// Timeline
							API.Builder.Timeline.render(data,layout,{prefix:"b3_"});
						});
					});
				}
			});
		},
	},
	review:function(data,layout,options = {},callback = null){
		if(options instanceof Function){ callback = options; options = {}; }
		var defaults = {icon: API.Plugins.b3.Timeline.icon,color: "secondary"};
		for(var [key, option] of Object.entries(options)){ if(API.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
		var url = new URL(window.location.href);
		API.Builder.modal($('body'), {
			title:'Review',
			icon:'review',
			zindex:'top',
			css:{ dialog: "modal-lg", header: "bg-success", body: "p-3"},
		}, function(modal){
			modal.on('hide.bs.modal',function(){ modal.remove(); });
			var dialog = modal.find('.modal-dialog');
			var header = modal.find('.modal-header');
			var body = modal.find('.modal-body');
			var footer = modal.find('.modal-footer');
			header.find('button[data-control="hide"]').remove();
			header.find('button[data-control="update"]').remove();
			body.append('<div class="row" data-content="files"><div class="col-12"></div></div>');
			body.append('<div class="row" data-content="notes"><div class="col-12"><textarea title="Note" name="note" class="form-control"></textarea></div></div>');
			var files = body.find('div[data-content="files"] div.col-12');
			var notes = body.find('div[data-content="notes"]').find('textarea');
			if(API.Helper.isSet(data,['relations','files'])){
				for(var [id, file] of Object.entries(data.relations.files)){
					if(file.filename.includes("MD"+data.this.raw.transaction_number) || file.filename.includes("DOCSET")){
						files.append(API.Plugins.files.Layouts.details.GUI.button(file,{download:API.Auth.validate('custom', url.searchParams.get("p")+'_files', 1),download:API.Auth.validate('custom', url.searchParams.get("p")+'_files', 4)}));
						files.find('button[data-action="view"').off().click(function(){
							API.Plugins.files.view($(this).attr('data-id'));
						});
						files.find('button[data-action="download"]').off().click(function(){
							API.Plugins.files.download($(this).attr('data-id'));
						});
						files.find('button[data-action="delete"]').off().click(function(){
							API.Plugins.files.delete($(this).attr('data-id'),$(this).attr('data-name'),layout);
						});
					}
				}
			}
			notes.summernote({
				toolbar: [
					['font', ['fontname', 'fontsize']],
					['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
					['color', ['color']],
					['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
				],
				height: 250,
			});
			footer.append('<div class="btn-group"></div>');
			var controls = footer.find('div.btn-group');
			controls.append('<button class="btn btn-warning" data-action="corrections"><i class="fas fa-pencil-alt mr-1"></i>'+API.Contents.Language['To Correct']+'</button>');
			controls.append('<button class="btn btn-success" data-action="reviewed"><i class="fas fa-check mr-1"></i>'+API.Contents.Language['Reviewed']+'</button>');
			controls.find('button[data-action]').off().click(function(){
				if(notes.summernote('isEmpty')){
					notes.summernote('destroy');
					notes.summernote({
						toolbar: [
							['font', ['fontname', 'fontsize']],
							['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
							['color', ['color']],
							['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
						],
						height: 250,
					});
				} else {
					var note = notes.summernote('code');
					var note = {
						by:API.Contents.Auth.User.id,
						content:notes.summernote('code'),
						relationship:url.searchParams.get("p"),
						link_to:data.this.raw.id,
					};
					notes.val('');
					notes.summernote('code','');
					notes.summernote('destroy');
					notes.summernote({
						toolbar: [
							['font', ['fontname', 'fontsize']],
							['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
							['color', ['color']],
							['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
						],
						code: note,
						height: 250,
					});
				}
				var action = $(this).attr('data-action');
				if(action == "corrections"){
					if(note != undefined && note != ''){
						API.request(url.searchParams.get("p"),'note',{data:note},function(result){
							var noteData = JSON.parse(result);
							if(noteData.success != undefined){
								API.Plugins.notes.Timeline.object(noteData.output.note.dom,layout);
								data.this.raw.status = 7;
								data.this.dom.status = 7;
								API.request('b3','review',{data:data.this.raw},function(result){
									var b3Data = JSON.parse(result);
									if(b3Data.success != undefined){
										API.Plugins.statuses.update(data,layout);
										if(callback != null){ callback(action,data,layout); }
									}
								});
							}
						});
					} else {
						alert('Please specify what corrections are needed.');
					}
				}
				if(action == "reviewed"){
					if(note != undefined && note != ''){
						API.request(url.searchParams.get("p"),'note',{data:note},function(result){
							var noteData = JSON.parse(result);
							if(noteData.success != undefined){
								API.Plugins.notes.Timeline.object(noteData.output.note.dom,layout);
								data.this.raw.status = 8;
								data.this.dom.status = 8;
								API.request('b3','review',{data:data.this.raw},function(result){
									var b3Data = JSON.parse(result);
									if(b3Data.success != undefined){
										API.Plugins.statuses.update(data,layout);
										if(callback != null){ callback(action,data,layout); }
									}
								});
							}
						});
					} else {
						data.this.raw.status = 8;
						data.this.dom.status = 8;
						API.request('b3','review',{data:data.this.raw},function(result){
							var b3Data = JSON.parse(result);
							if(b3Data.success != undefined){
								API.Plugins.statuses.update(data,layout);
								if(callback != null){ callback(action,data,layout); }
							}
						});
					}
				}
			});
			modal.modal('show');
		});
	},
	Timeline:{
		icon:"file-invoice",
		object:function(dataset,layout,options = {},callback = null){
			if(options instanceof Function){ callback = options; options = {}; }
			var defaults = {icon: API.Plugins.b3.Timeline.icon,color: "indigo"};
			for(var [key, option] of Object.entries(options)){ if(API.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
			if(typeof dataset.id !== 'undefined'){
				var dateItem = new Date(dataset.created);
				var dateUS = dateItem.toLocaleDateString('en-US', {day: 'numeric', month: 'short', year: 'numeric'}).replace(/ /g, '-').replace(/,/g, '');
				API.Builder.Timeline.add.date(layout.timeline,dataset.created);
				var checkExist = setInterval(function() {
					if(layout.timeline.find('div.time-label[data-dateus="'+dateUS+'"]').length > 0){
						clearInterval(checkExist);
						API.Builder.Timeline.add.filter(layout,'b3','B3');
						var html = '';
						html += '<div data-plugin="b3" data-id="'+dataset.id+'" data-b3="'+dataset.transaction_number+'" data-date="'+dateItem.getTime()+'">';
							html += '<i class="fas fa-'+defaults.icon+' bg-'+defaults.color+'"></i>';
							html += '<div class="timeline-item">';
								html += '<span class="time"><i class="fas fa-clock mr-2"></i><time class="timeago" datetime="'+dataset.created.replace(/ /g, "T")+'">'+dataset.created+'</time></span>';
								html += '<h3 class="timeline-header border-0">'+dataset.transaction_number+' was created</h3>';
							html += '</div>';
						html += '</div>';
						layout.timeline.find('div.time-label[data-dateus="'+dateUS+'"]').after(html);
						var element = layout.timeline.find('[data-plugin="b3"][data-id="'+dataset.id+'"]');
						element.find('time').timeago();
						var items = layout.timeline.children('div').detach().get();
						items.sort(function(a, b){
							return new Date($(b).data("date")) - new Date($(a).data("date"));
						});
						layout.timeline.append(items);
						element.find('i').first().addClass('pointer');
						element.find('i').first().off().click(function(){
							API.CRUD.read.show({ key:'transaction_number',keys:dataset, href:"?p=b3&v=details&id="+dataset.transaction_number, modal:true });
						});
						if(callback != null){ callback(element); }
					}
				}, 100);
			}
		},
	},
}

API.Plugins.b3.init();
