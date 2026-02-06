"use client"
export function AuthPage({isSignin}: { 
    isSignin: boolean
}) { 
    return<div className="text-center bg-linear-to-b from-blue-200 via-white to-red-200">
        
     <div className="w-screen h-screen flex justify-center items-center"> 
        <div className="flex flex-col gap-5 w-120 px-10 py-20 bg-white shadow-2xl rounded-2xl ">
             {isSignin ? <h1 className=" text-4xl font-bold">Signin Page</h1> : <h1 className=" text-4xl font-extrabold">Signup Page</h1>} 
            <input className="border-2 w-full h-10 rounded " type="text" placeholder="Email"></input>
            <input className="border-2 w-full h-10 rounded " type="text" placeholder="password"></input>
            <button className={`w-full h-10 rounded-xl text-white text-xl font-bold" ${isSignin ? "bg-blue-500" : "bg-red-500"}`} onClick={() => {
                 
            }}>{isSignin ? "signin" : "singup"}</button>
        </div>
    </div>
  </div>
}