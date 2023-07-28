import { component$, useContext, useSignal, useTask$ } from '@builder.io/qwik';
import { Link, routeLoader$, useLocation } from '@builder.io/qwik-city';
import type { Prisma } from '@prisma/client';
import Contributor from '~/components/project/Contributor';
import { Task } from '~/components/task/Task';
import { SocketContext } from '~/context/socket/SocketContext';
import { auth } from '~/lib/lucia';
import { prisma } from '~/lib/prisma';
// import type { Task as ITask } from '@prisma/client';

export const useLoaderProject = routeLoader$(async ({ params }) => {
  // the project data
  const project = await prisma.project.findUnique({
    where: {
      id: params.id,
    },
  });

  return {
    project,
  };
});

export const useLoaderContributors = routeLoader$(async ({ params }) => {
  // all the contributors that belong to the project
  const contributors = await prisma.project.findMany({
    where: {
      id: params.id,
    },
    select: {
      contributors: true,
    },
  });

  return {
    contributors: contributors[0].contributors,
  };
});

export const useLoaderUserAuth = routeLoader$(async ({ request, cookie }) => {
  const authRequest = auth.handleRequest({
    request: request,
    cookie: cookie,
  });

  const { user } = await authRequest.validateUser();

  return {
    user,
  };
});

// get merge types
export type TasksWithUserWhoCompletedTask = Prisma.TaskGetPayload<{
  include: {
    userWhoCompletedTask: true;
  };
}>;

export default component$(() => {
  const loaderProject = useLoaderProject();
  const loaderContributors = useLoaderContributors();
  const loaderUserAuth = useLoaderUserAuth();
  const tasks = useSignal<TasksWithUserWhoCompletedTask[]>([]);
  // const { tasks } = useContext(TaskContext);
  const { socket, isOnline } = useContext(SocketContext);
  const loc = useLocation();

  useTask$(({ track }) => {
    track(() => [isOnline.value]);
    socket.value?.on('connect', () => {
      isOnline.value = socket.value?.connected;
    });
  });

  useTask$(({ track }) => {
    track(() => socket.value);
    if (!socket.value) return;
    //socket options
    // socket.value.io.opts.extraHeaders = {
    //   projectId: loc.params.id,
    // };
    socket.value.io.opts.query = {
      projectId: loc.params.id,
    };
    // this is important to reflect the changes in the server
    socket.value.disconnect().connect();
  });

  // yo join the room that means that you will receive the messages from that room
  useTask$(({ track }) => {
    // we need to track the socket because it will change !important
    track(() => [socket.value]);
    if (!socket.value) return;

    socket.value.emit('open-project', loc.params.id);
  });

  // this task will be executed every time the socket changes
  useTask$(({ track }) => {
    track(() => [socket.value]);
    if (!socket.value) return;
    // only execute every time the socket changes
    socket.value.on('get-tasks', (payload: TasksWithUserWhoCompletedTask[]) => {
      tasks.value = payload;
    });
  });

  return (
    <>
      <div class="flex justify-between">
        <h1 class="font-black text-4xl">
          {loaderProject.value.project?.name ?? ''} -{' '}
          {isOnline.value ? 'Online' : 'Offline'}
        </h1>

        {loaderUserAuth.value.user?.userId ===
          loaderProject.value.project?.authorId && (
          <div class="flex items-center gap-2 text-gray-400 hover:text-black">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
              />
            </svg>

            <Link
              class="uppercase font-bold"
              href={`/projects/edit/${loaderProject.value.project?.id}`}
            >
              Editar
            </Link>
          </div>
        )}
      </div>
      {loaderUserAuth.value.user?.userId ===
        loaderProject.value.project?.authorId && (
        <Link
          href={`/projects/${loaderProject.value.project?.id}/task/new`}
          // onClick={projectStore.toggleModalFormTask}
          class="text-sm px-5 py-3 w-full md:w-auto rounded uppercase font-bold bg-sky-600 text-white text-center mt-5 flex gap-2 items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Nueva Tarea
        </Link>
      )}

      <p class="font-bold text-xl m4-10">Tareas del proyecto</p>
      <div class="bg-white shadow mt-10 rounded-lg">
        {tasks.value.length ? (
          tasks.value.map((task) => (
            <Task
              key={task.id}
              task={task}
              authorId={loaderProject.value.project?.authorId ?? ''}
              userAuthId={loaderUserAuth.value.user?.userId ?? ''}
            />
          ))
        ) : (
          <p class="text-center my-5 p-10">No hay tareas</p>
        )}
      </div>
      <div class="flex items-center justify-between mt-10">
        <p class="font-bold text-xl">Colaboradores</p>
        {loaderUserAuth.value.user?.userId ===
          loaderProject.value.project?.authorId && (
          <Link
            class="uppercase font-bold text-gray-400 hover:text-black transition-colors "
            href={`/projects/${loaderProject.value.project?.id}/new-contributor`}
          >
            Agregar colaborador
          </Link>
        )}
      </div>
      <div>
        {loaderContributors.value?.contributors.length ? (
          loaderContributors.value?.contributors.map((contributor) => (
            // <Contributor contributor={contributor} key={contributor.contributors.} />
            <Contributor
              contributor={contributor}
              key={contributor.id}
              projectId={loaderProject.value.project?.id ?? ''}
              authorId={loaderProject.value.project?.authorId ?? ''}
              userAuthId={loaderUserAuth.value.user?.userId ?? ''}
            />
          ))
        ) : (
          <p class="text-center my-5 p-10">No hay colaboradores</p>
        )}
      </div>
      {/* <ModalFormTask /> */}
    </>
  );
});
