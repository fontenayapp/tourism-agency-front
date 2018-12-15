Models = [];
Models["default"] = {exchangerates : [{"currency_id": 1000000, "code": "BRL", "date": "2018-12-01 00:00:00", "exchange": 10.0}, {"currency_id": 1000001, "code": "EUR", "date": "2018-12-01 00:00:00", "exchange": 45.5}, {"currency_id": 1000003, "code": "USD", "date": "2018-12-01 00:00:00", "exchange": 39.5}]};

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
            setCookie("access_token", result.access_token, 1);
            setCookie("refresh_token", result.refresh_token, 1);

            _loadAjaxSetup();

            window.location = '/pages/transactions.html';
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
    if(error.status === 401 || error.status === 422) {
        window.location = "/pages/login.html";
    } else if(error.status === 400) {
        alert("Error al enviar el pedido de creación de cliente. Contacte al administrador del sistema.");
    } else if(error.status === 503) {
        alert("Error interno del servidor. Contacte al administrador del sistema.");
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


/*----------------------------------------------------------------------*/
/*------------------------ POST ----------------------------------------*/
/*----------------------------------------------------------------------*/
function _createClient(sale) {
    _loadAjaxSetup();
    $.post(host+"/client",
        JSON.stringify(sale.client),
        function(result){
            _parseCreatedClientData(result, sale);
        }
    ).fail(function(error) {
        _manageError(error);
    });
}

function _createSale(client, sale) {
    var clientid = client.client_id;
    var products = sale.products;
    var promoterid = sale.promoter.promoter_id;

    var total = sale.total;

    var promotercommission = total*0.1;
    var sellercommission = (total*0.9 - parseInt($("#productstockprice").val()))*0.1625;

    _loadAjaxSetup();
    $.post(host+"/sale",
        JSON.stringify({
            client_id: clientid,
            promoter_id: promoterid,
            promoter_commission: promotercommission,
            //seller_id: sellerid,
            seller_commission: sellercommission,
            products: products,
            total: total
        }),
        function(result){
            _parseCreatedSaleData(result);
        }
    ).fail(function(error) {
        _manageError(error);
    });
}

function _saveExchangeRate(code, value) {
    var currencyCode = code;
    var exchangeRate = value;
    var currDate = _getLongCurrentDate();

    _loadAjaxSetup();
        $.post(host+"/currency",
        JSON.stringify({
            code: currencyCode,
            exchange: exchangeRate,
            date: currDate
        }),
        function(result){
            _parseCreatedCurrExchangeData(result);
        }
    ).fail(function(error) {
        _manageError(error);
    });
}



/*----------------------------------------------------------------------*/
/*------------------------ GET -----------------------------------------*/
/*----------------------------------------------------------------------*/
function _getPromotors(res, rej) {
    _loadAjaxSetup();

    $.get(host+"/promoters",
        function (result, error) {
            Models["promoters"] = result;
            res(result);
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
        rej(error);
    })
}

function _getProviders(res, rej) {
    _loadAjaxSetup();

    $.get(host+"/providers",
        function (result, error) {
            Models["providers"] = result;
            res(result);
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
        rej(error);
    })
}

function _getProducts(res, rej) {
    _loadAjaxSetup();

    $.get(host+"/products",
        function (result, error) {
            Models["products"] = result;
            res(result);
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
        rej(error);
    })
}

function _getTransactions(res, rej) {
    _loadAjaxSetup();

    $.get(host+"/transactions",
        function (result, error) {
            res(result);
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
        rej(error);
    })
}

function _getSales(res, rej) {
    _loadAjaxSetup();

    $.get(host+"/sales",
        function (result, error) {
            Models["sales"] = result;
            res(result);
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
        rej(error);
    })
}

function _getExchangeRates(res, rej) {
    _loadAjaxSetup();

    $.get(host+"/currencies",
        function (result, error) {
            Models["exchangerates"] = result;
            res(result);
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
        rej(error);
    })
}


/*----------------------------------------------------------------------*/
/*------------------------ PARSERS -------------------------------------*/
/*----------------------------------------------------------------------*/
function  _parseCreatedClientData(result, sale) {
    console.log(result);
    _createSale(result, sale);
}

function  _parseCreatedSaleData(result) {
    console.log(result);
}

function  _parseCreatedCurrExchangeData(result) {
    _refreshCurrenciesForm(result);
}

/*----------------------------------------------------------------------*/
/*------------------------ HELPERS -------------------------------------*/
/*----------------------------------------------------------------------*/

function _fixFormat(result) {
    var list = $.extend(true, [], result);
    list.forEach(function(e) {
        e.date = _getFormatDate(new Date(e.date));
    });
    return list;
}


function _fixSalesFormat(result) {
    var list = [];
    result.forEach(function(e) {
        var elem = {};
        elem.id = e.sale_id;
        elem.clientname = e.client.name;
        elem.passport = e.client.passport_number;
        elem.date = _getFormatDate(new Date(e.date));
        elem.seller = e.user.first_name + ' ' + e.user.last_name;
        elem.promoter = e.promoter.first_name + ' ' + e.promoter.last_name;
        elem.currency = e.currency || "N/A";
        elem.total = e.total;
        list.push(elem);
    });
    return list;
}


function _getFormatDate(dat){
    var month = dat.getMonth()+1;
    month = month > 9 ? month : "0"+month;
    return dat.getDate()+"-"+month+"-"+dat.getFullYear();
}


function _getExchangeRate(currency) {
    var exchRate = 1;
    if("ARS" === currency)
        exchRate = 1;
    else {
        var exchangeRates = Models.exchangerates ? Models.exchangerates : Models.default.exchangerates;
        exchRate = exchangeRates.find(function(el){return el.code === currency}).exchange;
    }
    return exchRate;
}


function _getCurrentDate(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    return yyyy+"-"+mm+"-"+dd;
}


function _getLongCurrentDate(){
    function addZero(i) {
        if (i < 10)
            i = "0" + i;
        return i;
    }
    var d = new Date();
    var h = addZero(d.getHours());
    var m = addZero(d.getMinutes());
    var s = addZero(d.getSeconds());
    return _getCurrentDate() + " " + h + ":" + m + ":" + s;
}


function _enableEdit(e) {
    $(".panel").removeClass("panel-green").addClass("panel-default");
    $(e.target).closest(".input-group").find("input")[0].disabled = false;
    $("form button.btn-success")[0].disabled = false;
}


function  _loadSaleProducts() {
    var list = [];
    var prodList = $(".productPanel");
    if(0 < prodList.length) {
        prodList.each(function(index, el){
            var elem = $(el);
            var prodID = Number(elem.find("#servicesel").val());
            var product = _findProduct(prodID);
            var provider = _findProvider(product.provider_id);

            var prod = {
                product_id: prodID,
                product: product,
                provider: provider,
                date: elem.find("#date").val() + " 00:00:00",
                transfer: elem.find("#transfersel").val(),
                price: Number(elem.find("#uprice").val()),
                adults: Number(elem.find("#adults").val()),
                children: Number(elem.find("#children").val()),
                babies: Number(elem.find("#babies").val()),
                stock_price: Number(Number(elem.find("#stockprice").val()))
            };
            list.push(prod);
        })
    }
    return list;
}


function _calculateProductsSubtotal(sale) {
    var subtotal = 0;
    var totalStock = 0;
    sale.products.forEach(function(e) {
        subtotal += e.price;
        totalStock += e.stock_price;
    });
    sale.subtotalAR = subtotal;
    sale.totalStockAR = totalStock;
}


function _findPromoter(id) {
    return Models.promoters.find(function(el){return el.promoter_id === Number(id)});
}


function _findProduct(id) {
    return Models.products.find(function(el){return el.product_id === Number(id)});
}


function _findProvider(id) {
    return Models.providers.find(function(el){return el.provider_id === Number(id)});
}



/*----------------------------------------------------------*/
/*------------------COOKIES----------------------------------*/
/*----------------------------------------------------------*/
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