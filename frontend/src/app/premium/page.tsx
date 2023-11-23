"use client"

import { useEffect, useState } from "react"
import getCookieValue from "../dashboard/getCookiesValue"
import * as jwt from "jsonwebtoken"
import { redirect } from "next/navigation"

const page = () => {
    const [userId, setuserId] = useState("")
    useEffect(() => {
        const id = getCookieValue("id")
        setuserId(id)
        const token = getCookieValue('signInToken')
        
        if(process.env.NEXT_PUBLIC_JWT_SECRET){               
            try{
                jwt.verify(token,process.env.NEXT_PUBLIC_JWT_SECRET)
            }catch(err){      
                return redirect("/")
            }
        }
    }, [])

    useEffect(() => {
        userId.length && checkPremiumUser()
    }, [userId])
    

    const checkPremiumUser = async () => {
        console.log(userId);        
        const res = await fetch(process.env.NEXT_PUBLIC_API_DOMAIN+"/check-premium/"+userId)
        const data = await res.json()
        console.log(data);        
        if(!data.premium){
            return window.location.href = "/dashboard"
        }
    }
    
    
  return (
    <main className="h-screen flex flex-col  px-5 py-5">
        This is premium page. You can only access it if you are a paid user.
    </main>
  )
}

export default page