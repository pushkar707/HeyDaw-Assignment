"use client"

import { ChangeEvent, FormEvent, useState } from "react"

export default function Home() {

  const [formValues, setFormValues] = useState({
    email: '',
    password: ''
  })

  const [error, setError] = useState({
    error:false,
    text:""
  })

  const loginUser = async(e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const {email, password} = formValues

    const response = await fetch("http://localhost:8000"+'/login', {
      method: 'POST',
      credentials:"include",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({email,password}), // Replace with your data
    });

    const data = await response.json()
    console.log(data);    
    if(!data.success){      
      setError({error:true,text:"User already exists, and wrong password"})
    }else{
      // localStorage.setItem("signInToken",data.token)
      // localStorage.setItem("userId",data.id)
      window.location.href = "/payment"
    } 
  }

  const handleChange = (e:ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };
  return (
    <main className="h-screen flex flex-col justify-center items-center px-5 py-5">
      <h3 className="text-center mb-4">Welcome to HeyDaw</h3>
      {/* Sign In Form */}
      <form className='w-full max-w-4xl bg-gray-50 h-fit p-8' onSubmit={loginUser}>
        <div className='mb-4'>
          <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email</label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <input value={formValues.email} onChange={handleChange} type="email" name="email" id="email" className="block w-full rounded-md border-0 py-2 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 placeholder:text-sm focus:ring-2 focus:ring-inset focus:ring-indigo-200 sm:text-sm sm:leading-6 text-sm" placeholder="Enter Your Email"/>
          </div>
        </div>

        <div className='mb-4'>
          <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">Password</label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <input value={formValues.password} onChange={handleChange} type="password" name="password" id="password" className="block w-full rounded-md border-0 py-2 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 placeholder:text-sm focus:ring-2 focus:ring-inset focus:ring-indigo-200 sm:text-sm sm:leading-6 text-sm" placeholder="Enter Your Password"/>
          </div>
        </div>

        {error.error && <p className="text-red-600 text-xs mb-4">{error.text}</p>}

        <button className='bg-green-600 text-white px-4 py-2 rounded-md mt-1 text-sm mb-4 block'>Login</button>
        <a href="/register" className='text-xs text-blue-700 block mx-auto text-center w-full'>Create Account Instead</a>
      </form>
  </main>
  )
}
