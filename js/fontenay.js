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
var host = "http://fontenay.herokuapp.com";
// var host = "http://10.30.10.167:5000";


/*FORCED LOGIN*/
function _login() {
    var username = $("#username").val(),
        password = $("#password").val();

    $.post(host+"/login",
        {
            "email": username,
            "password": password
        },
        function (result, error) {
            console.log("Login Success.");
            setCookie("access_token", result.access_token, 1);
            setCookie("refresh_token", result.refresh_token, 1);

            _loadAjaxSetup();

            window.location = '/pages/forms.html';
    }).fail(function(error) {
        if(error.status === 401) {
            $("#loginUnauthorizedText").show();
        }
    })
    //.always(function() {});
}

function _checkLogin() {
}

function _manageError(error) {
    if(error.status === 401) {
        alert("Credenciales erróneas. Inicie sesión nuevamente.");
    } else if(error.status === 400) {
        alert("Error al enviar el pedido de creación de cliente. Contacte al administrador del sistema.");
    } else if(error.status === 503) {
        alert("Error interno del servidor. Contacte al administrador del sistema.");
    } else if(error.status === 422) {
        alert("Error enviando datos.");
    } else {
        alert("Error desconocido: ", error.status);
    }
}

function _loadAjaxSetup() {
    $.ajaxSetup({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getCookie("access_token")
        }
    });
}

function _createClient() {
    var email = $("#emailconf").text();
    var clientname = $("#clientnameconf").text();
    var nationality = $("#nationalityconf").text();
    var hotel = $("#hotelconf").text();
    var room = $("#roomconf").text();
    var address = $("#addressconf").text();
    var passportid = $("#passportconf").text();
    var phone = $("#phonenumberconf").text();

    _loadAjaxSetup();
    $.post(host+"/client",
        JSON.stringify({
            email: email,
            name: clientname,
            nationality: nationality,
            hotel: hotel,
            address: address,
            room_number: room,
            passport_number: passportid,
            contact_number: phone
        }),
        function(result){
            _parseCreatedClientData(result);
        }
    ).fail(function(error) {
        _manageError(error);
    });
}

function _createSale(clientObj) {
    var clientid = clientObj.client_id;
    var products = _loadJSONProducts();
    var promoterid = 1;//$("#promotorsel").val();
    var sellerid = $("#sellersel").val();
    var promotercommission = _calcPromoterCommission();
    var sellercommission = _calcSellerCommission();

    _loadAjaxSetup();
    $.post(host+"/sale",
        JSON.stringify({
            client_id: clientid,
            promoter_id: promoterid,
            promoter_commission: promotercommission,
            //seller_id: sellerid,
            seller_commission: sellercommission,
            products: products,
            total: 123
        }),
        function(result){
            _parseCreatedSaleData(result);
        }
    ).fail(function(error) {
        _manageError(error);
    });
}

function  _parseCreatedClientData(result) {
    console.log(result);
    _createSale(result);
}

function  _parseCreatedSaleData(result) {
    console.log(result);
}


function _calcPromoterCommission(promoterid) {
    return 1001;
}

function _calcSellerCommission(sellerid) {
    return 2002;
}

function  _loadJSONProducts(result) {
    var list = [];
    var prodList = $(".productPanel");
    if(0 < prodList.length) {
        prodList.each(function(index, el){
            var prod = {
                product_id: 1,
                date: "2018-12-12 23:00:48",//$(el).find("#date").val(),
                transfer: true,//$(el).find("#transfersel").val(),
                price: 234324,
                adults: $(el).find("#adults").val(),
                children: $(el).find("#children").val(),
                babies: $(el).find("#babies").val()
            };
            list.push(prod);
        })
    }
    return list;
}


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