"use client"

import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import * as jwt from "jsonwebtoken"
import { redirect } from 'next/navigation'
import getCookieValue from './getCookiesValue'
import { Elsie_Swash_Caps } from 'next/font/google'

const page = () => {
    
    const [userEmail, setuserEmail] = useState("")
    const [userId, setuserId] = useState("")
    const [coupon, setcoupon] = useState("")
    const [mobileNumber, setMobileNumber] = useState("0")
    const [validCoupon, setvalidCoupon] = useState(false)
    const [isPremiumUser, setIsPremiumUser] = useState(false)
    useEffect(() => {
        const email = getCookieValue("email")
        setuserEmail(email)

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
        
        if(data.premium){
            setIsPremiumUser(true)
        }else{
            setIsPremiumUser(false)
        }
    }

    
    const handleCouponChange = async (e:ChangeEvent<HTMLInputElement>) => {
        setcoupon(e.target.value.toUpperCase())
        if(e.target.value.toUpperCase().length){
            const res = await fetch(process.env.NEXT_PUBLIC_API_DOMAIN+'/validate-coupon/'+e.target.value.toUpperCase())
            const data = await res.json()
            if(data.success){
                setvalidCoupon(true)
                console.log("valid");
                
            }else{
                setvalidCoupon(false)         
                console.log("invalid");
            }
        }
    }

    const handleSubmit = async (e:FormEvent) => {
        e.preventDefault()
        const res = await fetch(process.env.NEXT_PUBLIC_API_DOMAIN+'/create-checkout-session',{
            method: 'POST',
            credentials:"include",
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify({userEmail,mobileNumber,coupon})
        })
        const data = await res.json()
        console.log(data);        
        window.location.href = data.redirectUrl
    }


  return (
    <main className="h-screen flex flex-col  px-5 py-5">
      <h3 className="mb-4">Welcome {userEmail}</h3>
      {!isPremiumUser ? <>
        <p>You are currently on our free plan</p>
        <p>Fill the form below to be a premium user at just $9.99/month</p>

        <form method='POST' className='mt-4' onSubmit={handleSubmit}>
            <input value={userEmail} disabled type="email" name="email" id="email" className="mb-3 block w-[70%] rounded-md border-0 py-2 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 placeholder:text-sm focus:ring-2 focus:ring-inset focus:ring-indigo-200 sm:text-sm sm:leading-6 text-sm" placeholder="Enter Your Email"/>
            <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} type="number" name="mobileNumber" id="email" className="mb-3 block w-[70%] rounded-md border-0 py-2 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 placeholder:text-sm focus:ring-2 focus:ring-inset focus:ring-indigo-200 sm:text-sm sm:leading-6 text-sm" placeholder="Enter Your Mobile Number"/>
            <input value={coupon} onChange={handleCouponChange} type="text" name="coupon" id="email" className="mb-3 block w-[70%] rounded-md border-0 py-2 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 placeholder:text-sm focus:ring-2 focus:ring-inset focus:ring-indigo-200 sm:text-sm sm:leading-6 text-sm" placeholder="Coupon Code"/>
        
            {validCoupon && <p className='text-green-700 text-sm my-4'>Congrats! You have recived a 50% discount.</p>}

            <button className='bg-green-600 text-white px-4 py-2 rounded-md mt-1 text-sm mb-4 block'>Enroll Now</button>
        </form>
      </> : <p>You are a premium user. Click <a className='text-blue-800' href="/premium">here</a> to access your premium dashboard</p>}
  </main>
  )
}

export default page