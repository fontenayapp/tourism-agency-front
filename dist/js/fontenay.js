Models = [];
Models["default"] = {exchangerates : [{"currency_id": 1000000, "code": "BRL", "date": "2018-12-01 00:00:00", "exchange": 10.0}, {"currency_id": 1000004, "code": "BRT", "date": "2018-12-01 00:00:00", "exchange": 9.5}, {"currency_id": 1000001, "code": "EUR", "date": "2018-12-01 00:00:00", "exchange": 45.5}, {"currency_id": 1000003, "code": "USD", "date": "2018-12-01 00:00:00", "exchange": 39.5}]};

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
/***************               CONFIG            **************************/
/**************************************************************************/
// var host = "https://fontenay.herokuapp.com";
var host = "https://fontenay-staging.herokuapp.com";
// var host = "https://192.168.1.111:5000";

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
            _getUser();
        }).fail(function(error) {
        if(error.status === 401) {
            $("#loginUnauthorizedText").show();
        }
    })
    //.always(function() {});
}

function _logout() {

    $.post(host+"/logout",
        {},
        function (result, error) {
            setCookie("access_token");
            setCookie("refresh_token");
            setCookie("role");
            setCookie("userid");
            window.location = "/pages/login.html";
        }).fail(function(error) {
            window.location = "/pages/login.html";
        })
}

function _checkLogin(check) {
    var role = getCookie("role");
    if ((role === "undefined" || role === "") || (role === "2" && check) || (role === "3" && check))
        window.location = "/pages/login.html";
    if(role === "1")
        $(".forbidden").removeClass("forbidden");
    else {
        if(role === "2") {
            $("#reportseller").removeClass("forbidden");
        } else if(role === "3") {
            $("#reportpromoter").removeClass("forbidden");
        }
        $(".forbidden").remove();
    }
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

function _loadGetAjaxSetup() {
    $.ajaxSetup({
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + getCookie("access_token")
        }
    });
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

function _createProduct(product) {
    _loadAjaxSetup();
    $.post(host+"/product",
        JSON.stringify(product),
        function(result){
            _parseCreatedProductData(result);
        }
    ).fail(function(error) {
        _manageError(error);
    });
}

function _createProvider(provider) {
    _loadAjaxSetup();
    $.post(host+"/provider",
        JSON.stringify(provider),
        function(result){
            _parseCreatedProviderData(result);
        }
    ).fail(function(error) {
        _manageError(error);
    });
}


function _createSale(client, sale) {
    sale.seller_id = sale.seller.user_id;
    sale.client_id = client.client_id;
    sale.promoter_id = sale.promoter.user_id;
    sale.total = sale.totalAR;
    var commissions = _calculateCommissions(sale);
    sale.promoter_commission = commissions[0];
    sale.seller_commission = commissions[1];

    _loadAjaxSetup();
    $.post(host+"/sale",
        JSON.stringify(sale),
        function(result){
            _parseCreatedSaleData(result);
        }
    ).fail(function(error) {
        _manageError(error);
    });
}

function _createTransaction(tx) {
    _loadAjaxSetup();
    $.post(host+"/transaction",
        JSON.stringify(tx),
        function(result){
            _parseCreatedTransactionData(result);
        }
    ).fail(function(error) {
        _manageError(error);
    });
}

function _payPendingProduct(payment) {
    _loadAjaxSetup();
    $.post(host+"/pay",
        JSON.stringify(payment),
        function(result){
            _parseCreatedPaymentData(result);
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
/*------------------------ PUT ----------------------------------------*/
/*----------------------------------------------------------------------*/
function _saveProductDetails(product) {
    _loadAjaxSetup();

    $.ajax({
        url: host+"/product",
        type: "PUT",
        data: JSON.stringify(product),
        success: function(result){
            _parseEditedProduct(result);
        },
        fail: function(error) {
            _manageError(error);
        }
    });
    /*
     $.put(host+"/product",
     JSON.stringify({
     code: currencyCode,
     exchange: exchangeRate,
     date: currDate
     }),
     function(result){
     _parseEditedProduct(result);
     }
     ).fail(function(error) {
     _manageError(error);
     });
     */
}

function _saveProviderDetails(providerEdited) {
    _loadAjaxSetup();

    $.ajax({
        url: host+"/provider",
        type: "PUT",
        data: JSON.stringify(providerEdited),
        success: function(result){
            _parseEditedProvider(result);
        },
        fail: function(error) {
            _manageError(error);
        }
    });
}

function _deleteTransaction(txId) {
    _loadAjaxSetup();

    $.ajax({
        url: host+"/transaction/"+txId,
        type: "DELETE",
        success: function(result){
            _parseDeletedTransactionData(result)
        },
        fail: function(error) {
            _manageError(error);
        }
    });
}

function _deleteSale(saleId) {
    _loadAjaxSetup();

    $.ajax({
        url: host+"/sale/"+saleId,
        type: "DELETE",
        success: function(result){
            _parseDeletedSaleData(result)
        },
        fail: function(error) {
            _manageError(error);
        }
    });
}


function _deleteProvider(providerId) {
    _loadAjaxSetup();

    $.ajax({
        url: host+"/provider/"+providerId,
        type: "DELETE",
        success: function(result){
            _parseDeletedProviderData(result)
        },
        fail: function(error) {
            _manageError(error);
        }
    });
}


function _deleteProduct(productId) {
    _loadAjaxSetup();

    $.ajax({
        url: host+"/product/"+productId,
        type: "DELETE",
        success: function(result){
            _parseDeletedProductData(result)
        },
        fail: function(error) {
            _manageError(error);
        }
    });
}


/*----------------------------------------------------------------------*/
/*------------------------ GET -----------------------------------------*/
/*----------------------------------------------------------------------*/
function _getExchangeRates(res, rej) {
    _loadGetAjaxSetup();

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

function _getPendings(res, rej) {
    _loadGetAjaxSetup();

    $.get(host+"/pending",
        function (result, error) {
            Models["pending"] = result;
            res(result);
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
        rej(error);
    })
}

function _getProducts(res, rej) {
    _loadGetAjaxSetup();

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

function _getPromoters(res, rej) {
    _loadGetAjaxSetup();

    $.get(host+"/promoters",
        function (result, error) {
            //Discard the test users (id 2, 39 & 40)
            result = result.filter(function(value) {
                return (value.user_id !== 2) && (value.user_id !== 39) && (value.user_id !== 40);
            });
            Models["promoters"] = result;
            Models["user"] = result.find(function(e) {return e.user_id === Number(getCookie("userid"));});

            var orderedRes = result.filter(function(e) {return e.user_id !== Models["user"].user_id;});
            orderedRes.unshift(Models["user"]);
            res(orderedRes);
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
        rej(error);
    })
}

function _getProviders(res, rej) {
    _loadGetAjaxSetup();

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

function _getSale(res, rej, id) {
    _loadGetAjaxSetup();

    $.get(host+"/sale/" + id,
        function (result, error) {
            Models["sale/"+id] = result;
            res(result);
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
        rej(error);
    })
}


function _getSellers(res, rej) {
    _loadGetAjaxSetup();

    $.get(host+"/sellers",
        function (result, error) {
            Models["sellers"] = result;
            res(result);
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
        rej(error);
    })
}

function _getSales(res, rej) {
    _loadGetAjaxSetup();

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

function _getTransactions(res, rej) {
    _loadGetAjaxSetup();

    $.get(host+"/transactions",
        function (result, error) {
            Models["transactions"] = result;
            res(result);
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
        rej(error);
    })
}

function _getUser(res, rej) {
    _loadGetAjaxSetup();
    $.get(host+"/user",
        function (result, error) {
            Models["user"] = result;
            setCookie("role", result.role, 1);
            setCookie("userid", result.user_id, 1);
            if(result.role === 1)
                window.location = '/pages/transactions.html';
            else
                window.location = '/pages/newsale.html';
        }).fail(function(error) {
        if(error.status === 401 || error.status === 422) {
            window.location = "/pages/login.html";
        }
    })
}

function _getUsers(res, rej) {
    _loadGetAjaxSetup();

    $.get(host+"/users",
        function (result, error) {
            Models["users"] = result;
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
    _createSale(result, sale);
}

function  _parseCreatedCurrExchangeData(result) {
    _refreshCurrenciesForm(result);
}

function  _parseCreatedProductData(result) {
    _refreshCreateProductModal(result);
}

function  _parseCreatedProviderData(result) {
    _refreshCreateProviderModal(result);
}


function  _parseCreatedSaleData(result) {
    $("#wrapper").removeClass("mask");
    var noerror = true;
    if(noerror) {
        var x = document.getElementsByClassName("tab");
        x[currentTab-1].style.display = "none";
        showTab(4);
    } else {
        currentTab -= 1;
        showTab(3);
    }
    sale.success = result;
}

function  _parseCreatedTransactionData(result) {
    Models["transactions"] = result;
    _refreshCreateTransactionModal(result);
}

function _parseDeletedTransactionData(result) {
    _refreshDeleteTransactionModal(result);
}

function _parseDeletedProviderData(result) {
    _refreshDeleteProviderModal(result);
}

function _parseDeletedProductData(result) {
    _refreshDeleteProductModal(result);
}

function _parseDeletedSaleData(result) {
    _refreshDeleteSaleModal(result);
}

function  _parseEditedProduct(result) {
    _refreshEditProductModal(result);
}

function  _parseEditedProvider(result) {
    _refreshEditProviderModal(result);
}


/*----------------------------------------------------------------------*/
/*------------------------ HELPERS -------------------------------------*/
/*----------------------------------------------------------------------*/
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

function _calculateCommissions2(sale) {
    var subtotal = 0;
    var buenosAiresBusSold = false;
    var otherProductsSold = false;
    var buenosAiresBusPromoter = 0;
    var buenosAiresBusSeller = 0;
    var totalBsAsSale = 0;
    var totalSeller = 0;
    var subtotalSeller = 0;
    var adjust = sale.totalAR/sale.subtotalAR; //NECESARIO PARA SABER LA VARIACION ENTRE DESCUENTO APLICADO Y SUBTOTAL PARA DESCONTAR DEL VALOR DE CADA PRODUCTO

    sale.products.forEach(function(e) {
        var provID = Number(e.provider.provider_id);
        if(provID === 23) {//ES BUENOS AIRES BUS EN PRODUCCION
            buenosAiresBusSold = true;
            buenosAiresBusPromoter += 50 * (e.adults + e.children + e.babies);
            buenosAiresBusSeller += 17.87 * (e.adults + e.children + e.babies);
            totalBsAsSale += e.price;
        } else {
            otherProductsSold = true;
            subtotal += e.price * commRate * adjust;
        }
    });

    var totalPromoter = subtotal + buenosAiresBusPromoter;
    if(otherProductsSold && buenosAiresBusSold) {
        subtotalSeller = sale.totalAR - totalPromoter - totalBsAsSale;
        totalSeller = Number(((subtotalSeller - sale.totalStockAR)*0.1625).toFixed(2)) + buenosAiresBusSeller;
    } else if(otherProductsSold) {
        subtotalSeller = sale.totalAR - totalPromoter;
        totalSeller = Number(((subtotalSeller - sale.totalStockAR)*0.1625).toFixed(2));
    } else {
        totalSeller = buenosAiresBusSeller;
    }
    return [totalPromoter, totalSeller];
}

function _calculateCommissions(sale) {
    var reducedSale = sale.total;
    var otherProdCost = 0;
    var subtotalPromoter = 0;
    var totalBsAsSale = 0;
    var totalSeller = 0;
    var totalPromoter = 0;
    var otrosProductos = [];
    var productosBuenosAiresBus = [];

    sale.products.forEach(function(e) { (Number(e.provider.provider_id) === 23 ? productosBuenosAiresBus : otrosProductos).push(e);});

    productosBuenosAiresBus.forEach(function(e) {
        totalBsAsSale += e.price;
        var totalPeople = e.adults + e.children + e.babies;
        totalSeller += 17.87 * totalPeople;
        totalPromoter += 50 * totalPeople;
    });

    reducedSale -= totalBsAsSale;

    otrosProductos.forEach(function(e) {
        otherProdCost += e.stock_price;
    });

    subtotalPromoter = (reducedSale)*0.1;
    totalPromoter += subtotalPromoter;
    //TODO Improve this with new DB value
    var userid = Number(getCookie("userid"));
    var perc = (userid === 41) || (userid === 42) ? 0.2 : 0.1625;
    totalSeller += (reducedSale - otherProdCost - subtotalPromoter)*perc;

    return [totalPromoter, totalSeller];
}


function _enableEdit(e) {
    $(".panel").removeClass("panel-green").addClass("panel-default");
    $(e.target).closest(".input-group").find("input")[0].disabled = false;
    var successBtn = $("form button.btn-success")[0];
    successBtn ? successBtn.disabled = false : 0;
}

function _fillProductsTable(sale) {
    var prodTableBody = $("#productsSoldTableBody");
    prodTableBody.empty();
    sale.products.forEach(function(el){
        loadProdTableRow(el, prodTableBody);
    });
}

function _findProduct(id) {
    return Models.products.find(function(el){return el.product_id === Number(id)});
}

function _findPromoter(id) {
    return Models.promoters.find(function(el){return el.user_id === Number(id)});
}

function _findSeller(id) {
    return Models.promoters.find(function(el){return el.user_id === Number(id)});
}

function _findProvider(id) {
    return Models.providers.find(function(el){return el.provider_id === Number(id)});
}

function _fixFormat(result) {
    var list = $.extend(true, [], result);
    list.forEach(function(e) {
        e.date = _getFormatDateDDMMYYYY(e.date);
        e.expenseText = e.is_expense ? "Si" : "No";
        e.method = _getMethodString(e.method);
        e.amountARS = (e.amount * e.exchange).toFixed("2");
    });
    return list;
}

function _fixProductsFormat(result) {
    var list = [];
    result.forEach(function(e) {
        if(e.deleted === true)
            return;
        var elem = {};
        elem.id = e.product_id;
        elem.providername = e.provider.name; //e.provider.name;
        elem.providerid = e.provider_id;
        elem.description = e.description;
        elem.name = e.name;
        elem.sellingpriceadults = e.selling_price_adult;
        elem.stockpriceadults = e.stock_price_adult;
        elem.sellingpricechildren = e.selling_price_child;
        elem.stockpricechildren = e.stock_price_child;
        elem.sellingpricebabies = e.selling_price_baby;
        elem.stockpricebabies = e.stock_price_baby;
        list.push(elem);
    });
    return list;
}

function _fixProvidersFormat(result) {
    var list = [];
    result.forEach(function(e) {
        if(e.deleted === true)
            return;
        var elem = {};
        elem.id = e.provider_id;
        elem.name = e.name;
        elem.email = e.email;
        elem.phone = e.phone;
        elem.url = e.url;
        list.push(elem);
    });
    return list;
}

function _fixSalesFormat(result) {
    var list = [];
    result.forEach(function(e) {
        if(e.deleted === true)
            return;
        var elem = {};
        elem.promoter = e.promoter ? e.promoter : e.seller;
        elem.promoter_commission = e.promoter_commission;
        elem.seller_commission = e.user_commission;
        elem.id = e.sale_id;
        elem.email = e.client.email;
        elem.clientname = e.client.name;
        elem.passport = e.client.passport_number;
        elem.date = _getFormatDateDDMMYYYY(e.date);
        elem.seller = e.seller.first_name + ' ' + e.seller.last_name;
        elem.promoter = elem.promoter.first_name + ' ' + elem.promoter.last_name;
        elem.currency = e.currency || "N/A";
        elem.total = e.total;
        list.push(elem);
    });
    return list;
}

function _fixReportsFormat(result) {
    var list = [];
    result.filter(function(e) {
        return !e.deleted;
    }).forEach(function(e) {
        var elem = {};
        elem.promoter = e.promoter ? e.promoter : e.seller;
        elem.saleid = e.sale_id;
        elem.userid = e.seller.user_id;
        elem.promoterid = elem.promoter.user_id;
        elem.date = _getFormatDateDDMMYYYY(e.date);
        elem.seller = e.seller.first_name + " " + e.seller.last_name;
        elem.sellercommission = e.user_commission;
        elem.promoter = elem.promoter.first_name + " " + elem.promoter.last_name;
        elem.promotercommission = e.promoter_commission;
        elem.total = e.total;
        list.push(elem);
    });
    return list;
}

function _fixReportsPendingFormat(result) {
    var list = [];
    result.forEach(function(e) {
        var elem = {};
        var sale = Models["sales"].find(function(sale) {
            return sale.sale_id === e.sale_id;
        });
        var soldText = (e.adults !== 0 ? e.adults + " Ad. " : "") + (e.children !== 0 ? e.children + " Ni. " : "") + (e.babies !== 0 ? e.babies + " Be. " : "");
        elem.pendingid = e.sold_product_id;
        elem.providerid = e.product.provider.provider_id;
        elem.date = _getFormatDateDDMMYYYY(e.date);
        elem.productname = e.product.name;
        elem.clientname = sale.client.name;
        elem.numbersold = soldText;
        elem.providerid = e.product.provider.provider_id;
        elem.totalsold = e.price;
        elem.amounttopay = e.product.stock_price_adult * e.adults + e.product.stock_price_child * e.children + e.product.stock_price_baby * e.babies;
        list.push(elem);
    });
    return list;
}

function _getCurrencyID(currency) {
    var id = 0;
    var exchangeRates = Models.exchangerates ? Models.exchangerates : Models.default.exchangerates;
    id = exchangeRates.find(function(el){return el.code === currency}).currency_id;
    return id;
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

function _getFormatDateDDMMYYYY(stringDate){
    var dat = new Date();
    if(undefined !== stringDate) {
        dat = new Date(stringDate.replace(/-/g, '/').replace(/T/g,' '));
    }
    var day = dat.getDate();
    var month = dat.getMonth()+1;
    day = day > 9 ? day : "0"+day;
    month = month > 9 ? month : "0"+month;
    return day+"-"+month+"-"+dat.getFullYear();
}

function _getFormatDateYYYYMMDDHHMMSS(dat){
    if(undefined === dat) {
        dat = new Date();
    }
    var day = dat.getDate();
    var month = dat.getMonth()+1;
    var hours = dat.getHours();
    var minutes = dat.getMinutes();
    var seconds = dat.getSeconds();

    month = month > 9 ? month : "0"+month;
    day = day > 9 ? day : "0"+day;
    hours = hours > 9 ? hours : "0"+hours;
    minutes = minutes > 9 ? minutes : "0"+minutes;
    seconds = seconds > 9 ? seconds : "0"+seconds;
    return dat.getFullYear()+"-"+month+"-"+day+" "+hours+":"+minutes+":"+seconds;
}

function _getFormatDateDDMMYYYYHHMM(stringDate){
    var dat = new Date();
    if(undefined !== stringDate) {
        dat = new Date(stringDate.replace(/-/g, '/').replace(/T/g,' '));
    }
    var dateStr = _getFormatDateDDMMYYYY(stringDate);
    var hours = dat.getHours();
    var minutes = dat.getMinutes();

    hours = hours > 9 ? hours : "0"+hours;
    minutes = minutes > 9 ? minutes : "0"+minutes;
    return dateStr + " " +hours+":"+minutes;
}

function _getMethodString(method) {
    var methodStr = "";
    switch(method) {
        case "cash":
            methodStr = "Efectivo";
            break;
        case "transfer":
            methodStr = "Transferencia";
            break;
        case "card":
            methodStr = "Tarjeta";
            break;
        default:
            methodStr = "ERROR: Método desconocido";
    }
    return methodStr;
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

function loadProdTableRow(product, tableBody) {
    var td1 = $(document.createElement("td")).text(product.product.provider.name);
    var td2 = $(document.createElement("td")).text(product.product.name);
    var td3 = $(document.createElement("td")).text(_getFormatDateDDMMYYYY(product.date));
    var td4 = $(document.createElement("td")).text(product.transfer ? "Sí" : "No");
    var td5 = $(document.createElement("td")).text(product.adults);
    var td6 = $(document.createElement("td")).text(product.children);
    var td7 = $(document.createElement("td")).text(product.babies);
    var td8 = $(document.createElement("td")).text(product.price);
    var tr1 = $(document.createElement("tr")).append(td1).append(td2).append(td3).append(td4).append(td5).append(td6).append(td7).append(td8);
    tableBody.append(tr1);
}

function _loadProviderSelect(result, select) {
    result.forEach(function(element,index){
        var opt = $(document.createElement("option"));
        opt.text(element.name);
        opt.attr("value",element.provider_id);
        select.append(opt);
    })
}

function _loadUserSelect(result, select) {
    result.forEach(function(element,index){
        var opt = $(document.createElement("option"));
        opt.text(element.first_name + " "+ element.last_name);
        opt.attr("value",element.user_id);
        select.append(opt);
    })
}

function _loadSaleProducts() {
    var list = [];
    var prodList = $(".productPanel");
    if(0 < prodList.length) {
        prodList.each(function(index, el){
            var elem = $(el);
            var prodID = Number(elem.find("#servicesel").val());
            var product = _findProduct(prodID);

            var prod = {
                product_id: prodID,
                product: product,
                provider: product.provider,
                date: elem.find("#date").val() + ":00",
                transfer: JSON.parse(elem.find("#transfersel").val()),
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

function _validateHTMLForm(form) {
    var inputs, valid = true;
    inputs = form.find("input");
    for (i = 0; i < inputs.length; i++) {
        var elem = $(inputs[i]);
        elem.removeClass("invalid").parent().removeClass("has-error");
        if ("" === elem[0].value) {
            elem.addClass("invalid").parent().addClass("has-error");
            valid = false;
        }
    }
    return valid;
}













/*----------------------------------------------------------------------*/
/*------------------------ PROMISES ------------------------------------*/
/*----------------------------------------------------------------------*/
function _loadCurrencies() {
    var currenciesPromise = new Promise(
        function (resolve, reject) {
            _getExchangeRates(resolve, reject);
        }
    );

    var load = function() {
        currenciesPromise
            .then(function (result) {
                _loadCurrenciesHandler(result);
            })
            .catch(function (error) {
                console.log(error.message);
            });
    };
    load();
}

function _loadPromoters() {
    var promotersPromise = new Promise(
        function (resolve, reject) {
            _getPromoters(resolve, reject);
        }
    );

    var load = function() {
        promotersPromise
            .then(function (result) {
                _loadPromotersHandler(result);
            })
            .catch(function (error) {
                console.log(error.message);
            });
    };
    load();
}


function _loadSellers() {
    var sellersPromise = new Promise(
        function (resolve, reject) {
            _getSellers(resolve, reject);
        }
    );

    var load = function() {
        sellersPromise
            .then(function (result) {
                _loadSellersHandler(result);
            })
            .catch(function (error) {
                console.log(error.message);
            });
    };
    load();
}

function _loadProviders() {
    var providersPromise = new Promise(
        function (resolve, reject) {
            _getProviders(resolve, reject);
        }
    );

    var load = function() {
        providersPromise
            .then(function (result) {
                _loadProvidersHandler(result);
            })
            .catch(function (error) {
                console.log(error.message);
            });
    };
    load();
}

function _loadUsers() {
    var usersPromise = new Promise(
        function (resolve, reject) {
            _getUsers(resolve, reject);
        }
    );

    var load = function(usersPromise) {
        usersPromise
            .then(function (result) {
                _loadUsersHandler(result);
            })
            .catch(function (error) {
                console.log(error.message);
            });
    };
    load(usersPromise);
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


/*-------------------------------------------------*/

var placeSearch, autocomplete;

function initAutocomplete() {
    // Create the autocomplete object, restricting the search to geographical location types.
    autocomplete = new google.maps.places.Autocomplete((document.getElementById('autocomplete')),{
        componentRestrictions: {country: "AR"}
    });
    autocomplete.addListener('place_changed', fillInAddress);
}
/*
function fillInAddress() {
    var place = autocomplete.getPlace();
    document.getElementById('originPlaceID').value = place.place_id;
    document.getElementById('originPlaceID').disabled = true;
    _validateOrigin();
    $('#autocompleteOrigin').val(_getDirection(place.address_components))

}*/

function geolocate() {
    var travelCat = $("#selectTravelCategory").val();
    var geolocation = {
        lat: -34.3766824,
        lng: -59.82270990000001
    };
    var circle = new google.maps.Circle({
        center: geolocation,
        radius: 1
    });

    switch(travelCat) {
        case "to":
            autocompleteDestination.setBounds(circle.getBounds());
            break;
        case "from":
            autocompleteOrigin.setBounds(circle.getBounds());
            break;
        case "other":
            break;
        case "inside":
            autocompleteOrigin.setBounds(circle.getBounds());
            autocompleteDestination.setBounds(circle.getBounds());
            break;
        default:
            break;
    }


}
/*
 function _getDirection (address_components) {
 var aux = extractFromAddress(address_components , "route"), dir = "";
 dir += aux ? aux + " ":"";
 aux = extractFromAddress(address_components , "street_number");
 dir += aux ? aux + ", ": dir ? ",":"";
 aux = extractFromAddress(address_components , "locality");
 dir += aux ? aux + ", ":"";
 aux =  extractFromAddress(address_components , "administrative_area_level_1");
 dir += aux ? aux:"";
 return dir;
 }*/

function extractFromAddress(components, type) {
    try {
        var address = components.filter(function(component){
                return component.types.indexOf(type) === 0;
            }).map(function(item) {
                return item.long_name;
            }).pop() || null;
    } catch (e) {
        address = ""
    }
    return address;
}