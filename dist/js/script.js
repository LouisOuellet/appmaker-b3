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
							set:{
								status:1,
								priority:1,
								user:API.Contents.Auth.raw.User.id,
								email:API.Contents.Auth.raw.User.email,
								client:API.Contents.Auth.raw.User.client,
								phone:API.Contents.Auth.raw.User.phone,
							},
							clickable:{ enable:true, view:'details'},
							controls:{ toolbar:true},
							import:{ key:'id', },
						},function(response){});
					}
				});
			});
		},
	},
}

API.Plugins.b3.init();
