
var pmPeriodicTasks = new pmItems()

pmPeriodicTasks.model.name = "periodic-tasks"

 
pmPeriodicTasks.showSearchResults = function(holder, menuInfo, data)
{
    var thisObj = this;
    return $.when(this.searchItems(data.reg[1], 'playbook')).done(function()
    {
        $(holder).html(spajs.just.render(thisObj.model.name+'_list', {query:decodeURIComponent(data.reg[1])}))
    }).fail(function()
    {
        $.notify("", "error");
    })
}

pmPeriodicTasks.showItem = function(holder, menuInfo, data)
{
    var thisObj = this;
    console.log(menuInfo, data)
    var item_id = data.reg[1];

    return $.when(pmPeriodicTasks.loadItem(item_id), pmTasks.loadAllItems(), pmInventories.loadAllItems()).done(function()
    {
        $(holder).html(spajs.just.render(thisObj.model.name+'_page', {item_id:data.reg[1]}))
        
        $('#periodic-tasks_'+item_id+'_inventory').select2();
        
        new autoComplete({
            selector: '#periodic-tasks_'+item_id+'_playbook',
            minChars: 0,
            cache:false,
            showByClick:true, 
            renderItem: function(item, search)
            {
                return '<div class="autocomplete-suggestion" data-value="' + item.id + '.yaml">' + item.name + '.yaml</div>';
            },
            onSelect: function(event, term, item)
            {
                console.log('onSelect', term, item);
                var value = $(event.target).attr('data-value');
                $("#periodic-tasks_"+item_id+"_playbook").val($(event.target).text()); 
            },
            source: function(term, response)
            {
                term = term.toLowerCase();

                var matches = []
                for(var i in pmTasks.model.items)
                {
                    var val = pmTasks.model.items[i]
                    if(val.name.toLowerCase().indexOf(term) != -1)
                    {
                        matches.push(val)
                    }
                }
                response(matches);
            }
        });
    }).fail(function()
    {
        $.notify("", "error");
    })
}


/**
 * @return $.Deferred
 */
pmPeriodicTasks.addItem = function(parent_type, parent_item)
{
    var def = new $.Deferred();

    var data = {}

    data.playbook = $("#new_periodic-tasks_playbook").val()
    data.type = $("#new_periodic-tasks_type").val()
    data.inventory = $("#new_periodic-tasks_inventory").val()
    
    if(data.type == "CRONTAB")
    {
        data.schedule = $("#new_periodic-tasks_schedule_CRONTAB").val()
    }
    else
    {
        data.schedule = $("#new_periodic-tasks_schedule_DELTA").val()
    }
    
    data.vars = jsonEditor.jsonEditorGetValues()


    $.ajax({
        url: "/api/v1/"+this.model.name+"/",
        type: "POST",
        contentType:'application/json',
        data: JSON.stringify(data),
        beforeSend: function(xhr, settings) {
            if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                // Only send the token to relative URLs i.e. locally.
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        },
        success: function(data)
        {
            console.log("addItem", data);
            $.notify("periodic task created", "success");
 
            $.when(spajs.open({ menuId:"periodic-task/"+data.id})).always(function(){
                def.resolve()
            })  
        },
        error:function(e)
        {
            polemarch.showErrors(e.responseJSON)
            def.reject()
        }
    });
    return def.promise();
}

/**
 * @return $.Deferred
 */
pmPeriodicTasks.updateItem = function(item_id)
{
    var data = {}

    data.playbook = $("#periodic-tasks_"+item_id+"_playbook").val()
    data.type = $("#periodic-tasks_"+item_id+"_type").val()
    data.inventory = $("#periodic-tasks_"+item_id+"_inventory").val()
    
    if(data.type == "CRONTAB")
    {
        data.schedule = $("#periodic-tasks_"+item_id+"_schedule_CRONTAB").val()
    }
    else
    {
        data.schedule = $("#periodic-tasks_"+item_id+"_schedule_DELTA").val()
    }
    
    data.vars = jsonEditor.jsonEditorGetValues()

    return $.ajax({
        url: "/api/v1/"+this.model.name+"/"+item_id+"/",
        type: "PATCH",
        contentType:'application/json',
        data:JSON.stringify(data),
        beforeSend: function(xhr, settings) {
            if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                // Only send the token to relative URLs i.e. locally.
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        },
        success: function(data)
        {
            console.log("updateItem", data);
            $.notify("Save", "success");
        },
        error:function(e)
        {
            polemarch.showErrors(e.responseJSON)
        }
    });
}