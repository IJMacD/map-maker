(this["webpackJsonpmap-maker"]=this["webpackJsonpmap-maker"]||[]).push([[0],{13:function(e,t,n){e.exports=n(22)},18:function(e,t,n){},20:function(e,t,n){},21:function(e,t,n){"use strict";n.r(t),n.d(t,"API_ROOT",(function(){return r}));var r="https://lz4.overpass-api.de/api/interpreter"},22:function(e,t,n){"use strict";n.r(t);var r=n(0),a=n.n(r),o=n(11),c=n.n(o),i=(n(18),n(3)),s=n.n(i),u=n(4),l=n(5),f=n(1);n(20);function p(e,t){var n=a.a.useState((function(){var n=localStorage.getItem(e);if(n)try{t=JSON.parse(n)}catch(r){}return t})),r=Object(f.a)(n,2),o=r[0],c=r[1];return[o,function(t){localStorage.setItem(e,JSON.stringify(t)),c(t)}]}var d=n(2),h=n(7),v=n(8),b=function(){function e(t,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[];Object(h.a)(this,e),this.type=t,this.tags=n,this.pseudoClasses=r}return Object(v.a)(e,[{key:"toString",value:function(){return"".concat(this.type).concat(Object.entries(this.tags).map((function(e){var t=Object(f.a)(e,2),n=t[0],r=t[1];return"[".concat(n,"=").concat(r,"]")})).join(""))}}]),e}();function m(e,t){if(t.type!==e.type)return!1;for(var n=!0,r=0,a=Object.entries(e.tags);r<a.length;r++){var o=Object(f.a)(a[r],2),c=o[0],i=o[1];if(!t.tags||t.tags[c]!==i){n=!1;break}}return n}function g(e){for(var t,n,r=/^\s*@media\s+\(([a-z-]+)\s*(:|=|<=|>=|<|>)\s*([^)]+)\)\s*{/,a={mediaQueries:[],index:0},o=/^\s*}/;t=r.exec(e);){var c={left:t[1].trim(),operator:t[2].trim(),right:t[3].trim()};a.index+=t[0].length;var i=y(e=e.substring(t[0].length)),s=i.rules,u=i.index;a.index+=u,e=e.substring(u),(n=o.exec(e))?(a.mediaQueries.push({type:"query",predicate:c,rules:s}),a.index+=n[0].length):console.log("Unterminated media query")}return a}function y(e){for(var t,n=/^\s*([^{}]+)\s*{([^{}]*)}/,r={rules:[],index:0},a=function(){var n={};t[2].split(";").map((function(e){return e.trim()})).filter((function(e){return e})).forEach((function(e){var t=e.indexOf(":"),r=e.substring(0,t).trim(),a=e.substring(t+1).trim();n[r]=a}));var a=b.parseMultiple(t[1]);a.length&&r.rules.push({type:"rule",selectors:a,declarations:n}),r.index+=t[0].length,e=e.substring(t[0].length)};t=n.exec(e);)a();return r}function j(e,t){var n,r=[],a=Object(u.a)(e);try{for(a.s();!(n=a.n()).done;){var o=n.value;if("rule"===o.type){var c,i=o.declarations,s=Object(u.a)(o.selectors);try{for(s.s();!(c=s.n()).done;){var l=c.value;r.push({selector:l,declarations:i})}}catch(f){s.e(f)}finally{s.f()}}else O(o.predicate,t)&&r.push.apply(r,Object(d.a)(j(o.rules,t)))}}catch(f){a.e(f)}finally{a.f()}return r}function O(e,t){return"zoom"===e.left&&x[e.operator](t.zoom,e.right)}b.parse=function(e){var t=/^\s*([a-z]+)/.exec(e);if(!t)return null;var n=t[1];"rel"===n&&(n="relation");for(var r={},a=e.substring(t[0].length).trim(),o=/^\[([^[\]=]+)=([^[\]=]+)\]/;;){var c=o.exec(a);if(!c)break;r[c[1]]=c[2],a=a.substring(c[0].length)}for(var i=[],s=/^:([a-z]+)(?:\(([^)]+)\))?/;;){var u=s.exec(a);if(!u)break;i.push({name:u[1],params:u[2]?u[2].split(","):[]}),a=a.substring(u[0].length)}return a.length?(console.log("Invalid selector: ".concat(e," unexpected part: '").concat(a,"'")),null):new b(n,r,i)},b.parseMultiple=function(e){return e.split(",").map(b.parse).filter((function(e){return e}))};var x={":":function(e,t){return e==t},"=":function(e,t){return e==t},">":function(e,t){return e>t},"<":function(e,t){return e<t},">=":function(e,t){return e>=t},"<=":function(e,t){return e<=t}};function E(e,t){var n=e.split(","),r=Object(f.a)(n,4),a=r[0],o=r[1],c=r[2],i=r[3],s=t.split(","),u=Object(f.a)(s,4),l=u[0],p=u[1],d=u[2],h=u[3];return l>=a&&p>=o&&d<=c&&h<=i}function k(e){var t=e.split(",");return(+t[2]-+t[0])*(+t[3]-+t[1])}function w(e,t,n){var r=Object(f.a)(e,2),a=r[0],o=r[1],c=Object(f.a)(n,2),i=c[0],s=c[1],u=Math.pow(2,t),l=180/u*(i/256),p=180/u*(s/256);return[a-l,o-p,a+l,o+p].map((function(e){return e.toFixed(3)})).join(",")}function P(e){var t=e.current,n=t.clientWidth,r=t.clientHeight,a=n*devicePixelRatio,o=r*devicePixelRatio;e.current.width=a,e.current.height=o}function S(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[],r=arguments.length>3?arguments[3]:void 0,a=arguments.length>4?arguments[4]:void 0,o=arguments.length>5?arguments[5]:void 0;r.current&&function(){var c={};n.forEach((function(e){return"node"===e.type&&(c[e.id]=e)}));var i={};n.forEach((function(e){return"way"===e.type&&(i[e.id]=e)}));var s=r.current.getContext("2d"),l=r.current,p=l.clientWidth,h=l.clientHeight,v=p*devicePixelRatio,b=h*devicePixelRatio,m=M(e,t,v,b);if(s.save(),s.fillStyle=a.declarations.fill,s.strokeStyle=a.declarations.stroke,s.lineWidth=+a.declarations["stroke-width"]*devicePixelRatio,a.declarations.opacity&&(s.globalAlpha=+a.declarations.opacity),"map"===a.selector.type)s.beginPath(),s.rect(0,0,v,b),a.declarations.fill&&s.fill(),a.declarations.stroke&&s.stroke();else if("current"===a.selector.type&&o.current){var g=o.current.coords;s.beginPath();var y=+a.declarations.size*devicePixelRatio,j=m(g.longitude,g.latitude),O=Object(f.a)(j,2),x=O[0],E=O[1];s.ellipse(x,E,y,y,0,0,2*Math.PI),a.declarations.fill&&s.fill(),a.declarations.stroke&&s.stroke()}var k,P=Object(u.a)(n);try{for(P.s();!(k=P.n()).done;){var S=k.value;if(S.type===a.selector.type){if(s.beginPath(),"node"===S.type){var C=+a.declarations.size*devicePixelRatio,R=m(S.lon,S.lat),T=Object(f.a)(R,2),I=T[0],L=T[1];s.ellipse(I,L,C,C,0,0,2*Math.PI)}else if("way"===S.type){if(!S.nodes)continue;var B=S.nodes.map((function(e){return c[e]}));s.moveTo.apply(s,Object(d.a)(m(B[0].lon,B[0].lat)));for(var z=1;z<B.length;z++)s.lineTo.apply(s,Object(d.a)(m(B[z].lon,B[z].lat)))}else if("area"===S.type){if(!S.nodes)continue;var N=S.nodes.map((function(e){return c[e]}));s.moveTo.apply(s,Object(d.a)(m(N[0].lon,N[0].lat)));for(var q=1;q<N.length;q++)s.lineTo.apply(s,Object(d.a)(m(N[q].lon,N[q].lat)));s.closePath()}else if("relation"===S.type){if(!S.members)continue;var W,A=S.members.filter((function(e){return"way"===e.type})).map((function(e){return i[e.ref]})),_=Object(u.a)(A);try{for(_.s();!(W=_.n()).done;){var F=W.value.nodes.map((function(e){return c[e]}));s.moveTo.apply(s,Object(d.a)(m(F[0].lon,F[0].lat)));for(var K=1;K<F.length;K++)s.lineTo.apply(s,Object(d.a)(m(F[K].lon,F[K].lat)))}}catch(ge){_.e(ge)}finally{_.f()}s.closePath()}if(a.declarations.fill&&s.fill(),a.declarations.stroke&&s.stroke(),a.declarations.content&&"node"===S.type){var D=m(S.lon,S.lat),H=Object(f.a)(D,2),U=H[0],J=H[1],Q=a.declarations.content;if(Q.match(/^".*"$/g))Q=Q.replace(/^"|"$/g,"");else if(Q.match(/tag\(([^)]+)\)/)){var $=Q.match(/tag\(([^)]+)\)/);Q=S.tags[$[1]]||""}else Q="?";var G="".concat(10*devicePixelRatio,"px"),V="normal",X="sans-serif";a.declarations["font-size"]&&(G=a.declarations["font-size"].replace(/^\d[\d.]*/,(function(e){return"".concat(+e*devicePixelRatio)}))),a.declarations["font-weight"]&&(V=a.declarations["font-weight"]),a.declarations["font-family"]&&(X=a.declarations["font-family"]),s.font=a.declarations.font||"".concat(V," ").concat(G," ").concat(X),a.declarations.stroke&&s.strokeText(Q,U,J),!a.declarations.fill&&a.declarations.stroke||s.fillText(Q,U,J)}}}}catch(ge){P.e(ge)}finally{P.f()}if("gridlines"===a.selector.type){var Y=a.selector.pseudoClasses.find((function(e){return"vertical"===e.name})),Z=a.selector.pseudoClasses.find((function(e){return"horizontal"===e.name}));if(Y){var ee=w(e,t,[v,b]).split(","),te=parseFloat(Y.params[0]),ne=1/te,re=Math.floor(+ee[0]*ne)/ne,ae=Math.ceil(+ee[2]*ne)/ne,oe=Math.floor(+ee[1]*ne)/ne,ce=Math.ceil(+ee[3]*ne)/ne;s.beginPath();for(var ie=re;ie<=ae;ie+=te){s.moveTo.apply(s,Object(d.a)(m(ie,oe)));for(var se=oe;se<=ce;se+=te)s.lineTo.apply(s,Object(d.a)(m(ie,se)))}a.declarations.stroke&&s.stroke()}if(Z){var ue=w(e,t,[v,b]).split(","),le=parseFloat(Z.params[0]),fe=1/le,pe=Math.floor(+ue[0]*fe)/fe,de=Math.ceil(+ue[2]*fe)/fe,he=Math.floor(+ue[1]*fe)/fe,ve=Math.ceil(+ue[3]*fe)/fe;s.beginPath();for(var be=he;be<=ve;be+=le){s.moveTo.apply(s,Object(d.a)(m(pe,be)));for(var me=pe;me<=de;me+=le)s.lineTo.apply(s,Object(d.a)(m(me,be)))}a.declarations.stroke&&s.stroke()}}s.restore()}()}function M(e,t,n,r){var a=Object(f.a)(e,2),o=a[0],c=a[1],i=Math.pow(2,t),s=256/(180/i),u=256/(180/i),l=Math.PI/4,p=n/2,d=r/2,h=180*Math.log(Math.tan(l+c/180*Math.PI/2))/Math.PI;return function(e,t){var n=e,r=180*Math.log(Math.tan(l+t/180*Math.PI/2))/Math.PI;return[p+(n-o)*s,d-(r-h)*u]}}var C=n(12),R=function(){function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"OverpassElements";Object(h.a)(this,e);var n=indexedDB.open(t);n.addEventListener("upgradeneeded",(function(e){var t=e.target.result;t.createObjectStore("nodes",{keyPath:"id"}),t.createObjectStore("elements").createIndex("selectorIndex",["selector","area","bbox"],{unique:!1})})),this.db=new Promise((function(e,t){n.addEventListener("success",(function(t){var n=t.target;e(n.result)})),n.addEventListener("error",t)}))}return Object(v.a)(e,[{key:"saveNodes",value:function(){var e=Object(l.a)(s.a.mark((function e(t){var n,r,a,o,c;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.db;case 2:n=e.sent,r=n.transaction("nodes","readwrite").objectStore("nodes"),a=Object(u.a)(t);try{for(a.s();!(o=a.n()).done;)c=o.value,r.put(c)}catch(i){a.e(i)}finally{a.f()}case 6:case"end":return e.stop()}}),e,this)})));return function(t){return e.apply(this,arguments)}}()},{key:"getNode",value:function(){var e=Object(l.a)(s.a.mark((function e(t){var n;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.db;case 2:return n=e.sent,e.abrupt("return",new Promise((function(e,r){var a=n.transaction("nodes","readonly").objectStore("nodes").get(t);a.addEventListener("success",(function(t){return e(a.result)})),a.addEventListener("error",(function(e){return r(e)}))})));case 4:case"end":return e.stop()}}),e,this)})));return function(t){return e.apply(this,arguments)}}()},{key:"getNodes",value:function(e){var t=this;return Promise.all(e.map((function(e){return t.getNode(e)})))}},{key:"getElements",value:function(e,t){var n=T(e,t);return this.getElementsByKey(n)}},{key:"getElementsByKey",value:function(){var e=Object(l.a)(s.a.mark((function e(t){var n;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.db;case 2:return n=e.sent,e.abrupt("return",new Promise((function(e,r){var a=n.transaction("elements","readonly").objectStore("elements").get(t);a.addEventListener("success",(function(t){return e(a.result)})),a.addEventListener("error",r)})));case 4:case"end":return e.stop()}}),e,this)})));return function(t){return e.apply(this,arguments)}}()},{key:"searchElements",value:function(){var e=Object(l.a)(s.a.mark((function e(t,n){var r;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.db;case 2:return r=e.sent,e.abrupt("return",new Promise((function(e,a){var o=r.transaction("elements","readonly").objectStore("elements").index("selectorIndex"),c=IDBKeyRange.bound([n,0,"0"],[n,Number.MAX_VALUE,"999999999999999999"]),i=o.openKeyCursor(c),s=0;i.addEventListener("success",(function(r){var a=i.result;if(a){var o=a.key,c=a.primaryKey,u=o[2];if(s++,E(u,t))return console.debug("".concat(n," found after checking ").concat(s," records")),void e(c);a.continue()}else console.debug("".concat(n," not found after checking ").concat(s," records")),e(null)})),i.addEventListener("error",a)})));case 4:case"end":return e.stop()}}),e,this)})));return function(t,n){return e.apply(this,arguments)}}()},{key:"saveElements",value:function(){var e=Object(l.a)(s.a.mark((function e(t,n,r){var a,o,c;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.db;case 2:return a=e.sent,o=T(t,n),c=k(t),e.abrupt("return",new Promise((function(e,i){var s=a.transaction("elements","readwrite").objectStore("elements").put(Object(C.a)({selector:n,bbox:t,area:c},r),o);s.addEventListener("success",(function(){console.debug("Saved ".concat(n,"/").concat(t," to database with ").concat(r.elements.length," elements")),e()})),s.addEventListener("error",i)})));case 6:case"end":return e.stop()}}),e,this)})));return function(t,n,r){return e.apply(this,arguments)}}()}]),e}();function T(e,t){var n=e.split(",").map((function(e){return(+e).toFixed(3)})).join(",");return"".concat(n,"#").concat(t)}var I=n(21).API_ROOT,L=/(node|way|rel(?:ation)?|area)/,B=/(way|rel(?:ation)?|area)/,z=function(){function e(t){Object(h.a)(this,e),this.elements=new Map,this.bbox=t,this.database=new R}return Object(v.a)(e,[{key:"setBBox",value:function(e){E(this.bbox,e)||this.elements.clear(),this.bbox=e}},{key:"preLoadElements",value:function(){var e=Object(l.a)(s.a.mark((function e(t){var n,r,a,o,c,i,l,p,h,v,b,g,y,j,O=this;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:for(n=this.bbox,r={},t.forEach((function(e){return r[e.toString()]=e})),console.debug("Preloading Elements: ".concat(t.length," requested (").concat(Object.keys(r).length," unique)")),a=0,o=Object.entries(r);a<o.length;a++)c=Object(f.a)(o[a],2),i=c[0],l=c[1],L.test(l.type)||delete r[i];for(console.debug("Preloading Elements: ".concat(Object.keys(r).length," are Overpass Elements")),p=0,h=Object.keys(r);p<h.length;p++)v=h[p],this.elements.has(v)&&delete r[v];return console.debug("Preloading Elements: ".concat(Object.keys(r).length," not in HashMap")),e.next=10,Promise.all(Object.keys(r).map((function(e){return O.database.searchElements(n,e).then((function(t){t&&delete r[e]}))})));case 10:if(console.debug("Preloading Elements: ".concat(Object.keys(r).length," not in Database")),0!==Object.keys(r).length){e.next=13;break}return e.abrupt("return");case 13:return e.next=15,this.query(Object.values(r));case 15:return b=e.sent,g=b.elements,console.log("Preloading Elements: Fetched ".concat(g.length," elements from Server")),y={},g.forEach((function(e){return"node"===e.type&&(y[e.id]=e)})),j={},g.forEach((function(e){return"way"===e.type&&(j[e.id]=e)})),e.abrupt("return",Promise.all(Object.values(r).map((function(e){var t=g.filter((function(t){return m(e,t)}));if("relation"===e.type){var r,a=t.slice(),o=[],c=Object(u.a)(a);try{for(c.s();!(r=c.n()).done;){var i=r.value.members.map((function(e){return e.ref}));o.push.apply(o,Object(d.a)(i.map((function(e){return j[e]}))))}}catch(x){c.e(x)}finally{c.f()}t.push.apply(t,o);for(var s=0,l=o;s<l.length;s++){var f=l[s];t.push.apply(t,Object(d.a)(f.nodes.map((function(e){return y[e]}))))}}else if("way"===e.type){var p,h=t.slice(),v=Object(u.a)(h);try{for(v.s();!(p=v.n()).done;){var b=p.value;t.push.apply(t,Object(d.a)(b.nodes.map((function(e){return y[e]}))))}}catch(x){v.e(x)}finally{v.f()}}return O.elements.set(e.toString(),Promise.resolve(t)),O.database.saveElements(n,e.toString(),{elements:t,cached:Date.now()})}))));case 23:case"end":return e.stop()}}),e,this)})));return function(t){return e.apply(this,arguments)}}()},{key:"query",value:function(e){var t=e.map((function(e){return B.test(e.type)?"\n\t".concat(e,";\n\t>;"):e.toString()+";"})),n="[out:json][bbox];\n(".concat(t.join(""),"\n);\nout;"),r="".concat(I,"?data=").concat(n.replace(/\s/,""),"&bbox=").concat(this.bbox);return fetch(r.toString()).then((function(e){return e.ok?e.json():Promise.reject(e.status)}))}},{key:"tryElements",value:function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:10;return new Promise((function(r,a){t.query([e]).then((function(e){r(e.elements)}),(function(o){429!==o?a("Bad Response"):n>0?setTimeout((function(){t.tryElements(e,n-1).then(r,a)}),1e4):a(o)}))}))}},{key:"getElements",value:function(){var e=Object(l.a)(s.a.mark((function e(t){var n,r,a,o,c,i,u=this;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(L.test(t.type)){e.next=2;break}return e.abrupt("return");case 2:if(n=t.toString(),!this.elements.has(n)){e.next=5;break}return e.abrupt("return",this.elements.get(n));case 5:return e.next=7,this.database.getElements(this.bbox,t.toString());case 7:if(!(r=e.sent)){e.next=12;break}return a=r.elements,this.elements.set(n,Promise.resolve(a)),e.abrupt("return",a);case 12:return e.next=14,this.database.searchElements(this.bbox,t.toString());case 14:if(!(o=e.sent)){e.next=19;break}return c=this.database.getElementsByKey(o).then((function(e){return e.elements})),this.elements.set(n,c),e.abrupt("return",c);case 19:return i=this.tryElements(t),this.elements.set(n,i),i.catch((function(){return u.elements.delete(n)})),i.then((function(e){u.database.saveElements(u.bbox,t.toString(),{elements:e,cached:Date.now()})})),e.abrupt("return",i);case 24:case"end":return e.stop()}}),e,this)})));return function(t){return e.apply(this,arguments)}}()}]),e}();function N(e,t){var n=Object(r.useState)(e),a=Object(f.a)(n,2),o=a[0],c=a[1];return Object(r.useEffect)((function(){var n=setTimeout((function(){c(e)}),t);return function(){clearTimeout(n)}}),[e,t]),o}var q=function(){var e=p("USER_STYLE","node[amenity=post_box] {\n\tfill: black;\n\tsize: 2;\n}"),t=Object(f.a)(e,2),n=t[0],r=t[1],o=p("USER_CENTRE","7.1,50.7"),c=Object(f.a)(o,2),i=c[0],h=c[1],v=p("USER_SCALE",14),b=Object(f.a)(v,2),m=b[0],O=b[1],x=function(){var e=navigator.geolocation,t=a.a.useState(),n=Object(f.a)(t,2),r=n[0],o=n[1];return a.a.useEffect((function(){e.getCurrentPosition(o)}),[]),a.a.useEffect((function(){var t=e.watchPosition(o);return function(){return e.clearWatch(t)}}),[]),r}(),E=a.a.useRef(),k=a.a.useRef(),M=a.a.useState(!1),C=Object(f.a)(M,2),R=C[0],T=C[1],I=a.a.useState(""),L=Object(f.a)(I,2),B=L[0],q=L[1],W=E.current||{clientWidth:1e3,clientHeight:1e3},A=W.clientWidth,_=W.clientHeight,F=N(i,500),K=N(m,500),D=a.a.useMemo((function(){return w(F.split(",").map((function(e){return+e})),K,[A,_])}),[F,K,A,_]);k.current||(k.current=new z(D));var H=N(n,500),U=a.a.useMemo((function(){return function(e){for(var t={rules:[]},n=e.length;n>0;){var r,a,o=y(e);(r=t.rules).push.apply(r,Object(d.a)(o.rules));var c=g(e=e.substring(o.index).trim());if((a=t.rules).push.apply(a,Object(d.a)(c.mediaQueries)),(e=e.substring(c.index).trim()).length===n){console.log("Got stuck parsing style at: "+e);break}n=e.length}return t}(H)}),[H]);function J(e,t){var n=F.split(",").map((function(e){return+e})),r=360/Math.pow(2,m),a=[n[0]+e*r,n[1]+t*r];h(a.join(","))}return a.a.useEffect((function(){return k.current.setBBox(D)}),[D]),a.a.useEffect((function(){function e(){return(e=Object(l.a)(s.a.mark((function e(){var t,n,r,a,o,c,i,l;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return T(!0),q(""),e.prev=2,t={zoom:K,current:x},n=j(U.rules,t),e.next=7,k.current.preLoadElements(n.map((function(e){return e.selector})));case 7:r=n.map((function(e){return{rule:e,promise:k.current.getElements(e.selector)}})),P(E),a=F.split(",").map((function(e){return+e})),o=Object(u.a)(r),e.prev=11,o.s();case 13:if((c=o.n()).done){e.next=21;break}return i=c.value,e.next=17,i.promise;case 17:l=e.sent,S(a,K,l,E,i.rule,t);case 19:e.next=13;break;case 21:e.next=26;break;case 23:e.prev=23,e.t0=e.catch(11),o.e(e.t0);case 26:return e.prev=26,o.f(),e.finish(26);case 29:e.next=34;break;case 31:e.prev=31,e.t1=e.catch(2),q("Error Fetching");case 34:return e.prev=34,T(!1),e.finish(34);case 37:case"end":return e.stop()}}),e,null,[[2,31,34,37],[11,23,26,29]])})))).apply(this,arguments)}!function(){e.apply(this,arguments)}()}),[F,K,U]),a.a.createElement("div",{className:"App"},a.a.createElement("div",{className:"sidebar"},a.a.createElement("label",null,"Centre ",a.a.createElement("input",{value:i,onChange:function(e){return h(e.target.value)}})),a.a.createElement("button",{onClick:function(){return J(-1,0)}},"\u23f4"),a.a.createElement("button",{onClick:function(){return J(1,0)}},"\u23f5"),a.a.createElement("button",{onClick:function(){return J(0,1)}},"\u23f6"),a.a.createElement("button",{onClick:function(){return J(0,-1)}},"\u23f7"),a.a.createElement("button",{onClick:function(){return O(m+1)}},"\u2795"),a.a.createElement("button",{onClick:function(){return O(m-1)}},"\u2796"),x&&a.a.createElement("button",{onClick:function(){return h("".concat(x.coords.longitude,",").concat(x.coords.latitude))}},"\ud83d\udccd"),a.a.createElement("label",null,"Zoom ",a.a.createElement("input",{type:"number",value:m,onChange:function(e){return O(+e.target.value)}})),a.a.createElement("label",null,"Bounding Box ",a.a.createElement("input",{value:D,readOnly:!0})),a.a.createElement("label",null,"Style ",a.a.createElement("textarea",{value:n,onChange:function(e){return r(e.target.value)}})),R&&a.a.createElement("p",null,"Loading..."),B&&a.a.createElement("p",{style:{color:"red"}},B)),a.a.createElement("canvas",{ref:E}))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));c.a.render(a.a.createElement(a.a.StrictMode,null,a.a.createElement(q,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[13,1,2]]]);
//# sourceMappingURL=main.eb262f33.chunk.js.map