import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCsrfToken, Csrf } from '@edge-csrf/nextjs';

import '../styles/globals.css';

export default async function Page() {
  const csrfToken = await getCsrfToken();

  async function myAction() {
    'use server';

    // eslint-disable-next-line no-console
    console.log('passed csrf validation');
    revalidatePath('/');
    redirect('/');
  }

  return (
    <>
      <p>
        CSRF token value:
        {csrfToken}
      </p>
      <h2>Server Action Form Submission Example:</h2>
      <p>NOTE: Look at browser network logs and server console for submission feedback</p>
      <h3>Example 1:</h3>
      <form action={myAction}>
        <legend>Form without CSRF (should fail):</legend>
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <br />
			{/* <form action={myAction}>
        <legend>Form with CSRF component (should succeed):</legend>
        <Csrf />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form> */}
      <br />
      <form action={myAction}>
        <legend>Form with incorrect CSRF (should fail):</legend>
        <input type="hidden" name="csrf_token" value="notvalid" />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action={myAction}>
        <legend>Form with CSRF (should succeed):</legend>
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <h3>Example 2:</h3>
      <form action={myAction}>
        <legend>Form without CSRF (should fail):</legend>
        <input type="file" name="file1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action={myAction}>
        <legend>Form with incorrect CSRF (should fail):</legend>
        <input type="hidden" name="csrf_token" value="notvalid" />
        <input type="file" name="file1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action={myAction}>
        <legend>Form with CSRF (should succeed):</legend>
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <input type="file" name="file1" />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
