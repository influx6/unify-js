(function(){

    var _ = require("stackq");
    var b64 = require("Base64");
    var ba64 = require("base64-arraybuffer");
    var utf8 = require("utf8");
    var domain = require("./domain.js");
    var win = global.window;
    var doc = win.document;

    var Parser =  _.Mask(function(){

        var isUint8 = function(data){
            if(_.valids.not.isInstanceOf(data,global.Uint8Array)) return false;
            return true;
        };

        var isBuffer = function(data){
            if(_.valids.not.isInstanceOf(data,global.ArrayBuffer)) return false;
            return true;
        };

        var isBlob = function(data){
            if(_.valids.not.isInstanceOf(data,global.Blob)) return false;
            return true;
        };

        this.unsecure("encode",function(data,callback){
            if(_.valids.not.Function(callback)) return;
            if(isUint8(data)) return this.encodeBuffer(data,callback);
            if(isBuffer(data)) return this.encodeBuffer(data,callback);
            if(isBlob(data)) return this.encodeBlob(data,callback);
            return this.encode64(data,callback);
        });

        this.unsecure("encode64",function(data,callback){
            if(_.valids.not.Function(callback)) return;

            var ind = 0,src = data,dest,mesg = "";

            if(!isUint8(data) && !isBuffer(data) && !isBlob(data)){
                mesg += utf8.encode(data);
            }else{
                try{
                    dest = String.fromCharCode.apply(null,new Uint8Array(data))
                }catch(e){
                    src = new Array(src.length);
                    for(ind; ind < src.length; ind++){
                        src[ind] = data[ind];
                    }
                    dest = String.fromCharCode.apply(null,src);
                };

                var br = b64.btoa(dest);

                mesg += br;
            }


            return callback(mesg,dest);
        });

        this.unsecure("encodeBlob",function(data,callback){
            if(_.valids.not.isInstanceOf(data,global.Blob)) return;
            if(_.valids.not.Function(callback)) return;

            var file = new global.FileReader();
            file.onloaded = function(){
                var res = file.result;
                Parser.encode64(res,callback);
            };

            file.readAsArrayBuffer(data);
        });

        this.unsecure("encodeArrayBuffer",function(data,callback){
            if(_.valids.not.isInstanceOf(data,global.ArrayBuffer)) return;
            if(_.valids.not.Function(callback)) return;
            var buffer = new Uint8Array(data);
            Parser.encode64(buffer,callback);
        });

        this.unsecure("decode",function(data,callback){
            if(_.valids.not.Function(callback)) return;

        });

        this.unsecure("decode64",function(data,callback){
            if(_.valids.not.Function(callback)) return;

            var src,dest,mesg = "";

            if(!isUint8(data) && !isBuffer(data) && !isBlob(data)){
                mesg += utf8.decode(data);
            }else{

            }

            return callback(mesg,dest);
        });

        this.unsecure("decodeBlob",function(data,callback){
            if(_.valids.not.isInstanceOf(data,global.Blob)) return;
            if(_.valids.not.Function(callback)) return;

        });

        this.unsecure("decodeArrayBuffer",function(data,callback){
            if(_.valids.not.isInstanceOf(data,global.ArrayBuffer)) return;
            if(_.valids.not.Function(callback)) return;

        });

    });

    var unify = _.Mask(function(){
        var uni = this, cbhash = 0x4ffa;
        var xhrgen;

        this.Parser = Parser;

        var XHRMap = {
            cors: false,
            xdr: false,
            ssl: false,
            socket: false,
            credentials: true,
        };

        var createXDR = function(){
            if(typeof global.XDomainRequest === "undefined" && typeof XDomainRequest === "undefined"){
                return createXHR();
            }
            return function(){
                var xdr = new XDomainRequest();
                return xdr;
            };
        };

        var isXDR = function(o){
            if(typeof global.XDomainRequest === "undefined" && typeof XDomainRequest === "undefined"){
                return false;
            }
            return o instanceof XDomainRequest;
        };

        var isIOS = function(){
            if("undefined" != typeof global.navigator && /iPad|iPhone|iPod/i.test(global.navigator.userAgent)){
                return true;
            }
            return false;
        };

        var createXHR = function(){
            if(xhrgen) return xhrgen;

            xhrgen = (function(){
                if(_.valids.contains(global,"XMLHttpRequest")){
                    return function(){
                        return new XMLHttpRequest();
                    };
                }

                var lists = ["MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP","Microsoft.XMLHTTP"], fnx;

                _.enums.filter(lsits,function(e,i,o){
                    try{
                      var x = new ActiveXObject(e);
                    }
                    catch(e){
                      return;
                    }
                    return e;
                });

                return function(){
                    xml = _.enums.first(lists);
                    return new ActiveXObject(xml);
                };
            }());
            return xhrgen;
        };

        this.Connection = _.Configurable.extends({
            init: function(){
                this.$super()
            },
        });

        this.Transport = _.Configurable.extends({
            init: function(map,upgradable){
                map = _.Util.extends({},XHRMap,map);
                domain.Requests.is(map,function(state,report){
                    _.Asserted(state,_.Util.String(" ","invalid config properties for connection","\n",report));
                });

                if(upgradable){
                    uni.isTransport.is(upgradable,function(state,report){
                        _.Asserted(state,"not a valid transport class");
                    });
                }

                var self = this;
                this.$super();

                this.pub("error");
                this.pub("request");
                this.pub("done");
                this.pub("drain");

                this.connection = null;
                this.buffer = [];
                this.heartBeat = 1000;
                this.upgraded = upgradable;

                this.hooks = _.MiddlewareHooks.make("transport-hooks");

                if(map.socket){
                    this.scheme = map.ssl ? "wss" : "ws";
                }else{
                    this.scheme = map.ssl ? "https" : "http";
                }

                this.port = (_.valids.not.contains(map,"port") ? (map.ssl ? 443 : (global.location.port ? global.location.port : 80)) : (new String(map.port).replace(/^:/,"").toString()));
                this.host = (_.valids.not.contains(map,"host") ? global.location.hostname : map.host);
                this.binary = (_.valids.not.contains(map,"binary") ? false : true);
                this.binaryType = (_.valids.not.contains(map,"binary") ? "application/octect-stream": "text/plain;charset=utf-8");
                this.basetype = (_.valids.not.contains(map,"type") ? "x-www-form-urlencoded" : map.type);
                this.async = (_.valids.not.contains(map,"async") ? true : map.async);
                this.active = false;

                this.method = this.$bind(function(){
                    hasbuff = this.buffer.length > 0;
                    return _.valids.not.contains(this.map,"method") ? (hasbuff ? "POST" : "GET") : this.map.method;
                });

                this.$unsecure("makeURL",function(){
                    var q = this.getConfigAttr("query");
                    var qs = _.valids.exists(q) ? ( "?" + q) : "";
                    var uri = (this.scheme + "://" + this.host +  ":" + this.port + "/" + this.map.path.replace(/^\//,"") + qs);
                    return uri;
                });

                this.headers = _.Store.make();
                this.map = map;

                //switches to allow connection to available upgrades
                this.json = _.Switch();
                this.xhr = _.Switch();
                this.socket = _.Switch();

                this.json.on();
                this.xhr.on();
                this.socket.on();

                this.after("done",function(o){
                    self.connection = null;
                    self.active = false;
                });

                this.hooks.addBefore(function(d,next,end){
                    self.connection = d;
                    self.active = true;
                    self.emit("request",d);
                    next();
                });

                this.$secure("__update",function(upg){
                    if(_.valids.not.exists(upg)) return;

                    upgrades = _.enums.map(upg,function(e){ return e.toLowerCase(); });

                    this.upgrades = upgrades;

                    if(upgrades.indexOf("xhr") !== -1) this.xhr.on();
                    else this.xhr.off();

                    if(upgrades.indexOf("jsonp") !== -1 && upgrades.indexOf("json") !== -1) this.json.on();
                    else this.json.off();

                    if(upgrades.indexOf("websocket") !== -1) this.socket.on();
                    else this.socket.off();
                });

                //ensure to deal with memory leaks
                if(global.attachEvent){
                    global.attachEvent("onunload",self.$bind(self.disconnect));
                }else if(global.addEventListener){
                    global.addEventListener("beforeunload",self.$bind(self.disconnect));
                }
            },
            Headers: function(map){
              this.headers.addAll(map);
            },
            write: function(data){
                this.buffer.push(data);
                return this;
            },
            connect: function(){},
            disconnect: function(){},
            toXHR: function(map){
              if(!this.xhr.isOn()) return;
              map = _.Util.extends({},this.map,map);
              return uni.XHRTransport.make(map,this);
            },
            toWebSocket: function(){
              if(!this.socket.isOn()) return;
              map = _.Util.extends({},this.map,map);
              return uni.WebSocketTransport.make(map,this);
            },
            toJSON: function(){
              if(!this.json.isOn()) return;
              map = _.Util.extends({},this.map,map);
              return uni.JSONTransport.make(map,this);
            },
        });

        this.JSONTransport = this.Transport.extends({
            init: function(map,t){
                this.$super(map,t);

                var self = this;
                var rn = Math.floor(1 * Math.random(10));

                this.__cbName = ["__Callback",cbhash+=rn].join("");

                this.config({
                   "prehead": ["json=true","callback="+this.__cbName]
                });

                win[this.__cbName] = function(){
                  var args = _.enums.toArray(arguments);
                  self.handleReply.apply(self,args);
                };

                this.$secure("__frameLoad",function(e){
                    this.submitDoc.frame.onload = null;
                    this.submitDoc.frame.onreadystatechange = null;
                    var content = this.submitDoc.frame.contentDocument;
                    if(content){
                        var data = content.getElementsByTagName("pre");
                        if(data){
                            this.handleReply({ payload: data });
                        }
                    }
                    this.submitDoc.form.removeChild(this.submitDoc.frame);
                });

                this.$secure("createFrame",function(){
                    if(!this.submitDoc) this.createWriter();
                    var iframe, id = this.submitDoc.form.target;

                    try{
                        html = _.Util.String(' ',"<iframe","id=",_.funcs.singleQuote(id),"src='javascript:0'",">");
                        iframe = doc.createElement(html);
                    }catch(e){
                        iframe = doc.createElement("iframe");
                        iframe.src=("javascript:0");
                        iframe.name=id;
                    }

                    if(iframe.attachEvent){
                        iframe.onreadystatechange = function(e){
                            if(iframe.readyState == "complete"){
                                this.__frameLoad(e);
                            };
                        };
                    }else{
                      iframe.onload = this.__frameLoad;
                    }

                    this.submitDoc.form.appendChild(iframe);
                });

                this.$secure("createWriter",function(){
                    if(_.valids.not.exists(this.submitDoc)){
                        var form = doc.createElement("form");
                        var area = doc.createElement("textarea");
                        var id = "unify_writer";

                        form.className="json_writer";
                        form.target=id;
                        form.style.position = "absolute";
                        form.style.top='-1000px';
                        form.style.left='-1000px';
                        form.style.width = form.style.height = "0px";
                        form.method="POST";
                        form.setAttribute("accept-charset","utf-8");
                        area.name = 'd';

                        form.appendChild(area);

                        this.submitDoc = { form: form, area: area };
                        doc.body.appendChild(form);
                    }

                    this.submitDoc.form.action = this.makeURL();
                });

                this.$secure("flush",function(){
                    if(_.valids.not.Function(win[this.__cbName])){
                         win[this.__cbName] = this.$bind(function(){
                              var args = _.enums.toArray(arguments);
                              this.handleReply.apply(self,args);
                         });
                    }

                    if(this.buffer.length <= 0){
                        this.hooks.emitWith(this,doc.createElement("script"));
                    }else{
                        var data = "";
                        this.createWriter();
                        this.createFrame();
                        this.submitDoc.area.value = "";

                        _.enums.each(this.buffer,this.$bind(function(e,i,o,fx){
                            data += String(e).replace(/\\n/g,"\\\n").replace(/\n/g,"\\n");
                            return fx(null);
                        }),this.$bind(function(){
                            try{
                              this.submitDoc.area.value = data;
                              this.submitDoc.form.submit();
                            }catch(e){
                                self.emit("error",e);
                            }
                            this.buffer = [];
                        }));
                    }
                });

                this.$secure("handleReply",function(data){
                    var upgrades = data.Upgrades,
                        payload = data.Payload;
                        headers = data.headers;

                    this.headers = headers;
                    this.__update(upgrades);
                    map.fn.call(null,payload,headers);
                    this.emit("done",this.connection);
                });

                this.$secure("handleError",function(script,err){
                    this.emit("error",script,err);
                    script.onload = script.onerror = null;
                });

                this.hooks.addBefore(function(o,next,end){
                    o.onerror = function(e){
                        self.handleError(o,e);
                    };
                    next();
                });

                this.hooks.addBefore(function(o,next,end){
                    var heads = [];
                    this.headers.each(function(e,i,o,fx){
                        heads.push([i,e].join("="));
                    });

                    var prehead = this.getConfigAttr("prehead");
                    heads = heads.concat(prehead);

                    this.config({
                        hquery: heads.join("&")
                    });

                    next();
                });

                this.hooks.add(function(o,next,end){
                    var qs = !this.hasConfigAttr("hquery") ? "" : ("?" + this.getConfigAttr("hquery"))
                    o.src = this.makeURL() + qs;
                    doc.body.appendChild(o);
                    next();
                });
            },
            connect: function(){
                if(this.active) return this;
                this.flush();
                return this;
            },
            disconnect: function(){
                 doc.body.removeChild(this.connection);
                 delete win[this.__cbName];
                 return this;
            },
            toJSONP: function(){
                 return this;
            },
        });

        this.XHRTransport = this.Transport.extends({
            init: function(map,t){
                this.$super(map,t);
                var self = this;

                if(this.cors && this.xdr){
                  this.generator = createXDR();
                }else{
                 this.generator = createXHR();
                }

                this.$secure("flush",function(){
                    var req = this.generator();
                    this.connection = req;
                    this.hooks.emitWith(this,req);
                });

                this.$secure("handleReply",function(o){
                    var data,ctype,upgrades;
                    try{
                        try{
                            ctype = o.getResponseHeader("Content-Type").split(/;/)[0];
                            upgrades = o.getResponseHeader("Upgrades").split(/;/);
                        }catch(e){}

                        if(ctype === "application/octect-stream"){
                            data  = o.response;
                        }else{
                            if(!this.binary){
                              data = o.responseText;
                            }else{
                              data = o.response;
                            }
                        }
                    }catch(e){
                        this.emit("error",o,e);
                    }

                    this.__update(upgrades);
                    map.fn.call(null,data);
                    this.emit("done",data);
                });

                this.$secure("handleError",function(o,err){
                    this.emit("error",script,err);
                    o.onreadystatechange = o.onload = o.onerror = null;
                });

                this.hooks.add(function(o,next,end){
                    o.onerror = function(e){
                        self.handleError(o,e);
                    };
                    next();
                });

                this.hooks.add(function(o,next,end){
                    if (this.map.credentials){
                        o.withCredentials = true;
                    }

                    if (isXDR(o)){
                        o.onError = function(e){
                            self.handleError(o,e);
                        };

                        o.onLoad = function(){
                            self.handleReply(o);
                        };
                    }else{
                        o.onreadystatechange = function(){
                            if(4 != o.readyState) return;
                            if(200 == o.status || 1223 == o.status){
                                self.handleReply(o);
                            }else{
                                setTimeout(function(){
                                    self.handleError(o,self.status);
                                },0);
                            }
                        };
                    }

                    next();
                });

                this.hooks.addBefore(function(o,next,end){
                    var url = this.makeURL();
                    o.open(this.method(),url,this.async);
                    if(this.binary){
                        o.responseType = "arraybuffer";
                    }
                    next();
                });

                this.hooks.addBefore(function(o,next,end){
                    this.headers.each(function(e,i,o,fx){
                        o.setRequestHeader(i,e);
                    });
                    next();
                });

                this.hooks.addAfter(function(o,next,end){
                    var data = this.buffer.length == 1 ? this.buffer[0] : this.buffer;
                    this.buffer = [];
                    o.send(data);
                    this.emit("drain",o);
                    next();
                });
            },
            connect: function(){
                if(this.active) return this;
                this.flush();
                return this;
            },
            disconnect: function(){
              if(this.active){
                  this.connection.abort();
              }
              return this;
            },
        });

        this.WebSocketTransport = this.Transport.extends({
            init: function(map,t){
                map.socket = true;
                this.$super(map,t);
                var self = this;

                this.pub("drain");
                this.pub("open");
                this.pub("close");
                this.pub("reply");

                this.$secure("flushBuffer",function(){
                    if(this.buffer.length <= 0){
                      this.emit("drain",this.connection);
                    }else{
                       _.enums.each(this.buffer,this.$bind(function(data,i,o,fx){
                          Parser.encode64(data,this.writeNow);
                          return fx(null);
                       }),this.$bind(function(){
                           this.buffer.length = 0;
                          _.Util.nextTick(this.$bind(function(){
                              this.emit("drain",this.connection);
                          }));
                       }));
                    }
                });

                this.$secure("handleReply",function(ev){
                    if(isIOS()){
                      _.Util.nextTick(function(){
                         map.fn.call(null,ev.data,ev);
                      });
                    }else{
                     map.fn.call(null,ev.data,ev);
                    }
                    this.emit("reply",ev);
                });

                this.$secure("handleOpen",function(e){
                    this.emit("open",e);
                });

                this.$secure("handleError",function(e){
                    this.emit("error",e);
                });

                this.$secure("handleClose",function(e){
                    this.emit("close",e);
                });

                this.$secure("flush",function(e){
                    this.flushBuffer();
                });

                this.$secure("writeNow",function(data){
                    this.afterOnce("open",this.$bind(function(){
                       this.connection.send(data);
                    }));
                })

                this.hooks.addBefore(function(d,next,end){
                    d.binaryType = "arraybuffer";
                    d.onmessage = function(ev){
                      self.handleReply(ev);
                    };
                    d.onerror = function(e){
                      self.handleError(e);
                    };
                    d.onopen = function(){
                      self.handleOpen(d);
                    };
                    d.onclose = function(){
                      self.handleClose(d);
                    };
                    next();
                });

                this.hooks.addAfter(function(d,next,end){
                    this.flush();
                });
            },
            write: function(data){
               this.buffer.push(data);
            },
            connect: function(){
                if(this.active){
                    return this;
                }
                var ws = new WebSocket(this.makeURL());
                this.connection = ws;
                this.hooks.emitWith(this,ws);
                return this;
            },
            disconnect: function(){
              if(this.active){
                this.connection.close();
              }
              return this;
            },
        });

        this.unsecure("JSON",function(map){
            return this.JSONTransport.make(map);
        });

        this.unsecure("Websocket",function(map){
            return this.WebSocketTransport.make(map);
        });

        this.unsecure("XHR",function(map){
            return this.XHRTransport.make(map);
        });

        this.isTransport = _.Checker.Type(this.Transport.instanceBelongs);
    });

    module.exports = unify;
    global.Unify = unify;

}());

