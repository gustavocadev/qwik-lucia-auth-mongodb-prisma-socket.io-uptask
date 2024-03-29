import { component$, useVisibleTask$ } from '@builder.io/qwik';
import {
  type DocumentHead,
  Link,
  Form,
  useLocation,
  routeAction$,
  zod$,
  z,
} from '@builder.io/qwik-city';
import { auth } from '~/lib/lucia';

export const useAuthSigninAction = routeAction$(
  async (values, event) => {
    const authRequest = auth.handleRequest(event);

    const key = await auth.useKey('email', values.email, values.password);
    const session = await auth.createSession({
      userId: key.userId,
      attributes: {},
    });

    authRequest.setSession(session);

    // redirect to projects page
    throw event.redirect(303, '/projects');
  },
  zod$({
    email: z.string().email(),
    password: z.string().min(4),
  })
);

export default component$(() => {
  // const loginAction = useLoginAction()
  const authSignInAction = useAuthSigninAction();
  const loc = useLocation();

  useVisibleTask$(() => {
    console.log(`${loc.url.origin}/projects`);
  });

  return (
    <>
      <h1 class="text-sky-600 font-black text-6xl">
        Inicia sesion y administra tus{' '}
        <span class="text-slate-700">proyectos</span>
      </h1>
      <Form
        action={authSignInAction}
        class="mt-10 bg-white shadow rounded-lg p-10"
      >
        <input type="hidden" name="providerId" value="credentials" />

        <div>
          <label
            class="uppercase text-gray-600 block text-xl font-bold"
            for="email"
          >
            Email
          </label>
          <input
            type="text"
            id="email"
            placeholder="Email de registro"
            class="w-full mt-3 p-3 border rounded-xl bg-gray-50"
            name="email"
          />
        </div>

        <div class="mt-5">
          <label
            class="uppercase text-gray-600 block text-xl font-bold"
            for="password"
          >
            Password
          </label>
          <input
            type="text"
            id="password"
            placeholder="Password de registro"
            class="w-full mt-3 p-3 border rounded-xl bg-gray-50"
            name="password"
          />
          <input
            type="hidden"
            name="options.callbackUrl"
            value={`${loc.url.origin}/projects`}
          />
        </div>

        <button
          type="submit"
          class="bg-sky-700 w-full py-3 text-white uppercase font-bold rounded cursor-pointer hover:bg-sky-800 transition-colors mt-5"
        >
          Iniciar sesion
        </button>
      </Form>
      <nav class="lg:flex lg:justify-between">
        <Link
          href="/signup"
          class="block text-center my-5 text-slate-500 uppercase text-sm"
          preventdefault:reset
        >
          No tienes cuenta? Registrate
        </Link>

        <Link
          href="/recover-password"
          class="block text-center my-5 text-slate-500 uppercase text-sm"
          preventdefault:reset
        >
          Olvidaste tu password?
        </Link>
      </nav>
    </>
  );
});

export const head: DocumentHead = {
  title: 'Welcome to Qwik',
  meta: [
    {
      name: 'description',
      content: 'Qwik site description',
    },
  ],
};
