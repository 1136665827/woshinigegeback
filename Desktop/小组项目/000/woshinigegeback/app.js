const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const session = require("express-session");


var pool = mysql.createPool({
   host:"rdc.sae.sina.com.cn",
   user:"ym210wnk4m",
   password:"04jx5wxljlk5mk4z4xlj142x504jmj2532h342w5",
   database:"app_woshinigege",
   port:3306,
   connectionLimit:20
})

var server = express();

server.use(cors({
   origin:["http://127.0.0.1:8080","http://localhost:8080"],
   credentials:true 
}))

server.use(session({
   secret:"128位安全字符串",
   resave:true,   
   saveUninitialized:true
}));

server.use(express.static("public"))

server.listen(3000,()=>{console.log("Listen port 3000......")});



server.get("/login",(req,res)=>{

 var uname = req.query.uname;
 var upwd =  req.query.upwd;

 var sql = "SELECT uid FROM ulogin WHERE uname = ? AND upwd = md5(?)";

 pool.query(sql,[uname,upwd],(err,result)=>{

   if(err)throw err;
  
   if(result.length==0){
     res.send({code:-1,msg:"用户名或密码有误"});
   }else{
  
	 
     var uid=result[0].uid;
     req.session.uid=uid;
     console.log(req.session)
     res.send({code:1,msg:"登录成功"});
   }

 })
})

server.get("/unameisok",(req,res)=>{
   var uname=req.query.uname;
   var sql="select did from ulogin where uname = ?"
   pool.query(sql,[uname],(err,result)=>{
      if(err) throw err;
	  if(result.length>0){
		res.send({code:-1})
	  }else{
		res.send({code:1})
	  }
   })
})


server.get("/reg",(req,res)=>{
   var uname=req.query.uname;
   var upwd=req.query.upwd;
   var shouji=req.query.shouji;
   var shengri=req.query.shengri;
   var regtime=req.query.regtime;
   var sql="insert into user value (null,?,md5(?),0,?,?,?)";
   pool.query(sql,[uname,upwd,shengri,shouji,regtime],(err,result)=>{
     if(result.affectedRows>0){
		 var sqll="insert into ulogin value (null,?,?,md5(?),0,0)";
		 pool.query(sqll,[result.insertId,uname,upwd],(err,result)=>{
		 if(result.affectedRows>0){
				 res.send({code:1})
			 }
		 })
	 }
   })
})



server.get("/haoyou",(req,res)=>{
   var uid=req.session.uid;
   if(!uid){
      res.send({code:-1})
   }else{
      var sql="SELECT fid FROM haoyou WHERE uid = ?";
      pool.query(sql,[uid],(err,result)=>{
			if(result.length>0){
			var friends=[];
			var sql=`SELECT touxiang,uname FROM user WHERE uid = ${result[0].fid} `;
			for(let i=1;i<result.length;i++){
			sql+=`or uid = ${result[i].fid} `
			}
			console.log(sql)
			pool.query(sql,[],(err,result)=>{
				res.send({code:1,firends:result})
			})
			
			}else{
				res.send({code:-1})
			}
      })
   }
})


server.get("/guangchang",(req,res)=>{
      var sql="select * from user,neirong where user.uid = neirong.uid order by shijian desc"
      pool.query(sql,[],(err,result)=>{
      if(err) throw err; 
      res.send({data:result})
   })
   
   
})

server.get("/haoyoudongtai",(req,res)=>{
	var uid=req.session.uid;
	if(!uid){
      res.send({code:-1})
	}else{
	var sql="SELECT fid FROM haoyou WHERE uid = ?"
    pool.query(sql,[uid],(err,result)=>{
    if(err) throw err; 
    if(result.length==0){
		
	}else{
		var sql=`select * from user,neirong where(user.uid = neirong.uid) and ( user.uid = ${result[0].fid}`;
		for(var i=1;i<result.length;i++){
			sql+=` or user.uid=${result[i].fid} `
		}
		sql+=") order by shijian desc";
		pool.query(sql,[],(err,result)=>{
			if(err) throw err;
			res.send({data:result})
		})
	}
   })
	}
})

server.get("/getxiangqing",(req,res)=>{
	var nid=req.query.nid;
	var sql="select * from user,neirong where user.uid = neirong.uid and nid = ?"
	pool.query(sql,[nid],(err,result)=>{
		if(err) throw err;
		if(result.length!=0){
			res.send({code:1,data:result})
		}else{
			res.send({code:-1})
		}
		
	})
})

server.get("/touxiang",(req,res)=>{
      var sql="select touxiang from user,neirong where user.uid = neirong.uid order by neirong.shijian desc"
      pool.query(sql,[],(err,result)=>{
      if(err) throw err; 
      res.send({data:result})
   })
   
   
})

server.get("/searchn",(req,res)=>{
	  var se=req.query.se;
	  console.log(se);
	  var sql=`select * from user,neirong where user.uid = neirong.uid and neirong.neirong like '%${se}%' order by shijian desc`;
	  pool.query(sql,[],(err,result)=>{
	  if(err) throw err; 
	  console.log(result)
      res.send({data:result})
	  })
})

server.get("/zan",(req,res)=>{
	  var nid=req.query.nid;
	  console.log(nid);
	  var sql=`UPDATE neirong SET shuliang = shuliang+1 WHERE neirong.nid = ?`
		  console.log(sql);
	  pool.query(sql,[nid],(err,result)=>{
	  if(err) throw err; 
	  console.log(result)
      res.send({code:1})
	  })
})

server.get("/goout",(req,res)=>{
	req.session.destroy();
	console.log(req.session)
	res.send({code:1})
})

server.get("/adddongtai",(req,res)=>{
	var uid=req.session.uid;
	var neirong=req.query.neirong;
	var time=req.query.time;
	if(!uid){res.send({code:-1})}else{
	var sql="insert into neirong value (null,?,0,0,?,?)";
	pool.query(sql,[uid,neirong,time],(err,result)=>{
		if(err) throw err;
		if(result.affectedRows>0){
			res.send({code:1})
		 }
	})
	}
})

server.get("/getme",(req,res)=>{
	var uid=req.session.uid;
	if(uid){
		var sql="select * from user where uid = ?";
		pool.query(sql,[uid],(err,result)=>{
			if(err) throw err;
			if(result.length>0){
				res.send({code:1,data:result})
			 }
		})
	}else{
		res.send({code:-1})
	}
})

server.get("/updata",(req,res)=>{
	var uid=req.session.uid;
	var uname=req.query.uname;
    var upwd=req.query.upwd;
    var shouji=req.query.shouji;
    var shengri=req.query.shengri;
	if(uid){
		var sql="UPDATE user SET uname = ?,upwd=md5(?),shouji=?,shengri=? WHERE uid = ?";
		pool.query(sql,[uname,upwd,shouji,shengri,uid],(err,result)=>{
			if(err) throw err;
			if(result.affectedRows>0){
				var sql="UPDATE ulogin SET uname = ?,upwd=md5(?) WHERE uid = ?";
				pool.query(sql,[uname,upwd,uid],(err,result)=>{
					if(result.affectedRows>0){
						res.send({code:1})
					}else{
						res.send({code:-1})
					}
				})
			}
		})
	}else{
		res.send({code:-1});
	}
})

server.get("/addf",(req,res)=>{
	var uid=req.session.uid;
	var fid=req.query.fid;
	var sql="insert into haoyou value (null,?,?,null,null)"
	pool.query(sql,[uid,fid],(err,result)=>{
		if (err) throw err;
		if(result.affectedRows>0){
			pool.query(sql,[fid,uid],(err,result)=>{
			res.send({code:1})
			})
		}
	})
	
	})

server.get("/getpinglun",(req,res)=>{
	var nid=req.query.nid;
	var sql="select * from pinglun,user where pinglun.uid=user.uid and pinglun.nid = ? order by pinglun.pingluntime desc"
	pool.query(sql,[nid],(err,result)=>{
		if(err) throw err;
		if(result.length>0){
			res.send({code:1,data:result})
		}else{
			res.send({code:-1})	
		}
	})
})

server.get("/addpinglun",(req,res)=>{
	var uid=req.session.uid;
	if(uid){
		var neirong=req.query.pl;
		console.log(req.query)
		var time=req.query.time;
		var nid=req.query.nid;
		var sql="insert into pinglun value (null,?,?,?,?)";
		pool.query(sql,[uid,nid,neirong,time],(err,result)=>{
			if(result.affectedRows>0){
				var sql="UPDATE neirong SET pinglun = pinglun+1 WHERE nid = ?";
				pool.query(sql,[nid],(err,result)=>{
					if(result.affectedRows>0){
						res.send({code:1})
					}
				})
			}
		})
	}else{
		res.send({code:-1})
	}
})

server.get("/udongtai",(req,res)=>{
	var uid;
	if(req.query.uid!=0){
		uid=req.query.uid;	
	}else{
		uid=req.session.uid;
	}
	var sql="select * from user,neirong where user.uid = neirong.uid and user.uid= ? order by shijian desc";
	pool.query(sql,[uid],(err,result)=>{
		if(result.length>0){
			res.send({code:1,data:result})
		}else{
			res.send({code:-1})	
		}
	})
})

server.get("/fdongtai",(req,res)=>{
	var uname=req.query.uname;
	var sql="select * from user,neirong where user.uid = neirong.uid and user.uname= ? order by shijian desc";
	pool.query(sql,[uname],(err,result)=>{
		if(result.length>0){
			res.send({code:1,data:result})
		}else{
			res.send({code:-1})	
		}
	})
})

server.get("/delf",(req,res)=>{
	var uname=req.query.uname;
	var uid=req.session.uid;
	var sql="select uid from user where uname = ?";
	pool.query(sql,[uname],(err,result)=>{
		console.log(result[0].uid);
		var fid=result[0].uid;
		var sql="delete from haoyou where uid=? and fid= ?";
		pool.query(sql,[uid,fid],(err,result)=>{
			pool.query(sql,[fid,uid],(err,result)=>{
				res.send({code:1})
			})
		})
	})
})

server.get("/deld",(req,res)=>{
	var nid=req.query.nid;
	console.log(nid)
	var sql="delete from neirong where nid=?";
	pool.query(sql,[nid],(err,result)=>{
			res.send({code:1})
	})
})

server.get("/self",(req,res)=>{
	var uid=req.session.uid;
	if(uid){
		var sql="select * from user where uid = ?"
		pool.query(sql,[uid],(err,result)=>{
			if(err) throw err;
			res.send({code:1,data:result})
		})
	}else{
			res.send({code:-1})
	}
})




server.get("/delm",(req,res)=>{
   var uid=req.session.uid;
   if(!uid){
      res.send({code:-2,msg:"请登录"});
      return;
   }else{
      var ids=req.query.ids;
      var sql=`delete from xz_cart where lid in(${ids})`
      console.log(sql)
      pool.query(sql,(err,result)=>{
         if(err)throw err;
         console.log(result)
         if(result.affectedRows>0){
            res.send({code:1,msg:"删除成功"})
         }else{
            res.send({code:-1,msg:"删除失败"})
         }
      })
   }
})

