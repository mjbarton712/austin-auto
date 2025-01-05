'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type AuthError = {
    message: string;
};

export function SignIn() {
    const { signIn, signUp } = useAuth()
    const navigate = useNavigate()
    const [error, setError] = useState<string>('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setError('')
            setSuccessMessage('')
            
            if (isSignUp) {
                await signUp(values.email, values.password)
                setSuccessMessage('Account created! Please check your email for verification.')
                form.reset()
            } else {
                await signIn(values.email, values.password)
                navigate('/')
            }
        } catch (error: unknown) {
            const authError = error as AuthError;
            setError(authError.message || 'An error occurred');
            console.error(error);
        }
    }

    return (
        <div className="min-h-screen w-full bg-gradient-custom flex items-center justify-center py-12 px-6 sm:px-8 lg:px-10 form-container">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        {isSignUp ? 'Create an account' : 'Sign in to your account'}
                    </h2>
                </div>
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {successMessage && (
                    <Alert className="bg-green-600 text-white">
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            className="bg-gray-800 text-white border-gray-700"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            className="bg-gray-800 text-white border-gray-700"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="space-y-4">
                            <Button
                                type="submit"
                                className="w-full"
                                variant="gradient"
                            >
                                {isSignUp ? 'Sign up' : 'Sign in'}
                            </Button>
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSignUp(!isSignUp)
                                        setError('')
                                        setSuccessMessage('')
                                        form.reset()
                                    }}
                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                >
                                    {isSignUp 
                                        ? 'Already have an account? Sign in' 
                                        : "Don't have an account? Sign up"}
                                </button>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
} 