// import { useState } from 'react';
// import { useRouter } from 'next/router';
// import axios from 'axios';
// import { useForm } from 'react-hook-form';
// import Link from 'next/link';
//
// export default function RegisterPage() {
//     const router = useRouter();
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState('');
//
//     const {
//         register,
//         handleSubmit,
//         formState: { errors },
//         watch
//     } = useForm();
//
//     const password = watch("password");
//
//     const onSubmit = async (data) => {
//         setLoading(true);
//         setError('');
//         setSucc