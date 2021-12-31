API.Plugins.b3 = {
	init:function(){
		API.GUI.Sidebar.Nav.add('b3', 'main_navigation');
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
						API.Builder.table(card.children('.card-body'), dataset.output.dom, {
							headers:dataset.output.headers,
							id:'b3Index',
							modal:true,
							key:'id',
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
			API.request(url.searchParams.get("p"),'get',{data:{id:id,key:'id'}},function(result){
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
										// API.request('b3','review',{ data:data.this.raw },function(){
										// 	API.Plugins.b3.load.details();
										// });
									});
								});
							}
							// Transaction Number
							API.GUI.Layouts.details.data(data,layout,{field:"transaction_number"});
							// Status
							if(API.Helper.isSet(API.Plugins,['statuses']) && API.Auth.validate('custom', 'b3_statuses', 1)){
								API.Plugins.statuses.Layouts.details.detail(data,layout);
							}
							// Organizations
							if(API.Helper.isSet(API.Plugins,['organizations']) && API.Auth.validate('custom', 'b3_organizations', 1)){
								API.Plugins.organizations.Layouts.details.detail(data,layout);
							}
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
	Timeline:{
		icon:"file-invoice",
		object:function(dataset,layout,options = {},callback = null){
			if(options instanceof Function){ callback = options; options = {}; }
			var defaults = {icon: API.Plugins.b3.Timeline.icon,color: "secondary"};
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
							API.CRUD.read.show({ key:'id',keys:dataset, href:"?p=b3&v=details&id="+dataset.id, modal:true });
						});
						if(callback != null){ callback(element); }
					}
				}, 100);
			}
		},
	},
}

API.Plugins.b3.init();
