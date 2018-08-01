$(function() {
    $('#side-menu').metisMenu();
});

//Loads the correct sidebar on window load,
//collapses the sidebar on window resize.
// Sets the min-height of #page-wrapper to window size
$(function() {
    $(window).bind("load resize", function() {
        var topOffset = 50;
        var width = (this.window.innerWidth > 0) ? this.window.innerWidth : this.screen.width;
        if (width < 768) {
            $('div.navbar-collapse').addClass('collapse');
            topOffset = 100; // 2-row-menu
        } else {
            $('div.navbar-collapse').removeClass('collapse');
        }

        var height = ((this.window.innerHeight > 0) ? this.window.innerHeight : this.screen.height) - 1;
        height = height - topOffset;
        if (height < 1) height = 1;
        if (height > topOffset) {
            $("#page-wrapper").css("min-height", (height) + "px");
        }
    });

    var url = window.location;
    // var element = $('ul.nav a').filter(function() {
    //     return this.href == url;
    // }).addClass('active').parent().parent().addClass('in').parent();
    var element = $('ul.nav a').filter(function() {
        return this.href == url;
    }).addClass('active').parent();

    while (true) {
        if (element.is('li')) {
            element = element.parent().addClass('in').parent();
        } else {
            break;
        }
    }
});





/**************************************************************************/
/***************               MODELS            **************************/
/**************************************************************************/
/*FORCED LOGIN*/
$.post("http://fontenay.herokuapp.com/login",
    {
        "email": "test@gmail.com",
        "password": "abcxyz"
    },
    function(result){
        console.log("SUCCESS", result);
        setCookie("access_token", result.access_token, 1);
        setCookie("refresh_token",result.refresh_token,1);
    }
);

$.ajaxSetup({
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getCookie("access_token")
    }
});

function _createClient() {
    var email = $("#emailconf").text();
    var clientname = $("#clientnameconf").text();
    var nationality = "Argentina";
    var hotel = $("#hotelconf").text();
    var adults = 1;
    var children = 0;
    var babies = 0;

    $.post("http://fontenay.herokuapp.com/client",
        JSON.stringify({
            email: email,
            name: clientname,
            nationality: nationality,
            hotel: hotel,
            adults: adults,
            children: children,
            babies: babies
        }),
        function(result){
            _parseCreatedClientData(result);
        }
    );
}

function  _parseCreatedClientData(result) {
    //if(result is an an error) {abort}
    // Show error modal. keep editing
    //Check if there's some error. Otherwise show the message.
    // else
    console.log(result);
    alert(success);
    //_getAllTravels();
}

/*

 "name": "/sale",
 "request": {
 "method": "POST",
 "header": [
 {
 "key": "Authorization",
 "value": "Bearer {{access_token}}"
 },
 {
 "key": "Content-Type",
 "value": "application/json"
 }
 ],
 "body": {
 "mode": "raw",
 "raw": "{  \n   \"products\":[  \n      {  \n         \"product_id\":1,\n         \"price\":1000\n      },\n      {  \n         \"product_id\":2,\n         \"price\":1000\n      },\n      {  \n         \"product_id\":3,\n         \"price\":1000\n      }\n   ],\n   \"client_id\":5,\n   \"total\":4000\n}"
 },
 "url": {
 "raw": "{{url}}/sale",
 "host": [
 "{{url}}"
 ],
 "path": [
 "sale"
 ]
 },
 "description": ""
 },

 */
/*-----------------------------------------------------------------------------*/
function _getUser(FBID) {
    $("body").LoadingOverlay('show');
    $.get("/users/"+ FBID, function(result){
        _parseGetUserData(result);
    });
}

function _createUser(FBID, Name, Surname) {
    $.post("/users",
        {
            fbID: FBID,
            firstName: Name,
            lastName: Surname
        },
        function(result){
            _parseCreateUserData(result);
        });
}

function _getUserDetails(FBID) {
    $.get("/users/"+ FBID, function(result){
        _parseGetUserDetailData(result);
    });
}

function _getAllTravels() {
    $.ajax({url: "/travels", success: function(result){
        _parseGetAllTravelsData(result);
    }});
}

function _getAllPassengersByTravel(travelID) {
    $.ajax({url: "/travels/" + travelID + "/passengers", success: function(result){
        _parseGetAllPassengersByTravelData(result);
    }});
}

function _createTravel(distance) {
    var seats = $('#selectNumberOfSeats').val();
    var category = $('#selectTravelCategory').val();
    var origin = $('#originPlaceID').val();
    var from = $('#autocompleteOrigin').val();
    //from = from.slice(0, from.lastIndexOf(','));
    var destination = $('#destinationPlaceID').val();
    var to = $('#autocompleteDestination').val();
    // to = to.slice(0, to.lastIndexOf(','));
    const date = $('#datepicker').data("DateTimePicker").date();
    const time = $('#timepicker').data("DateTimePicker").date();
    var datetime = new Date(
        date._d.getFullYear(),
        date._d.getMonth(),
        date._d.getDate(),
        time._d.getHours(),
        time._d.getMinutes(),
        time._d.getSeconds()
    );
    var tolls = $('#selectTolls').val();
    var mate = $('#selectMate').val();
    var pet = $('#selectPet').val();
    var description = $('#travelDescription').val();
    var carBrand = $('#carBrand').val();
    var carColor = $('#carColor').val();
    var carLicensePlate = $('#carLicensePlate').val();
    var fbid = Models.myuser.fbid;

    $.post("/travels",
        {
            fbid: fbid,
            type: category,
            numberofseats: seats,
            origin: origin,
            from: from,
            destination: destination,
            to: to,
            departuredate: datetime,
            mate: mate,
            pet: pet,
            description: description,
            tolls: tolls,
            distance: distance,
            carbrand: carBrand,
            carcolor: carColor,
            carlicenseplate: carLicensePlate
        },
        function(result){
            _parseCreatedTravelData(result);
        }
    );

}

function _deleteATravel(travelId) {
    $.ajax({
        url: '/travels/' + travelId,
        type: 'DELETE',
        success: function(result){
            _parseDeleteTravel(result);
        }
    });
}


function _editTravel(idTravel, dist) {
    var seats = $('#selectNumberOfSeats').val();
    var category = $('#selectTravelCategory').val();
    var origin = $('#originPlaceID').val();
    var from = $('#autocompleteOrigin').val();
    //from = from.slice(0, from.lastIndexOf(','));
    var destination = $('#destinationPlaceID').val();
    var to = $('#autocompleteDestination').val();
    // to = to.slice(0, to.lastIndexOf(','));
    const date = $('#datepicker').data("DateTimePicker").date();
    const time = $('#timepicker').data("DateTimePicker").date();
    var datetime = new Date(
        date._d.getFullYear(),
        date._d.getMonth(),
        date._d.getDate(),
        time._d.getHours(),
        time._d.getMinutes(),
        time._d.getSeconds()
    );
    var tolls = $('#selectTolls').val();
    var mate = $('#selectMate').val();
    var pet = $('#selectPet').val();
    var description = $('#travelDescription').val();
    var carBrand = $('#carBrand').val();
    var carColor = $('#carColor').val();
    var carLicensePlate = $('#carLicensePlate').val();
    var userid = Models.myuser.id;
    var dataObj = {
        userid: userid,
        type: category,
        numberofseats: seats,
        origin: origin,
        from: from,
        destination: destination,
        to: to,
        departuredate: datetime,
        mate: mate,
        pet: pet,
        description: description,
        tolls: tolls,
        carbrand: carBrand,
        carcolor: carColor,
        carlicenseplate: carLicensePlate
    };

    if(0 !== dist)
        dataObj.distance = dist;

    $.ajax({
        url: '/travels/' + idTravel,
        type: 'PUT',
        data: dataObj,
        success: function(result){
            _parseEditTravelData(result);
        }
    });
}


function _addPassengerToTravel(travelId) {
    var passengerfbid = Models.myuser.fbid;
    $.post("/passengers",
        {
            fbid: passengerfbid,
            travelid: travelId
        },
        function(result){
            _parseAddPassengerToTravel(result);
        });

}

function _deletePassengerFromATravel(passengerId) {
    $.ajax({
        url: '/passengers/' + passengerId,
        type: 'DELETE',
        success: function(result){
            _parseDeletePassengerFromTravel(result);
        }
    });
}

function _editPassenger(data) {
    var dataObj = {
        travelid: data.travelid,
        state: data.state
    };

    $.ajax({
        url: '/passengers/' + data.passengerid,
        type: 'PUT',
        data: dataObj,
        success: function(result){
            _parseEditPassengersData(result);
        }
    });

}


function _getConfigurations(FBID) {
    $.get("/configurations", function (result) {
        _parseGetConfigurations(result);
    });
}







/*------------------COOKIES----------------------------------*/
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookie() {
    var user = getCookie("username");
    if (user != "") {
        alert("Welcome again " + user);
    } else {
        user = prompt("Please enter your name:", "");
        if (user != "" && user != null) {
            setCookie("username", user, 365);
        }
    }
}

function deleteCookie(cname) {
    document.cookie = cname+'=; Max-Age=-99999999;';
}