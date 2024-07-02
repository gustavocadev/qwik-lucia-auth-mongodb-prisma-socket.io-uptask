import {
  $,
  component$,
  useContext,
  useSignal,
  useTask$,
} from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import * as dateFns from 'date-fns';
import { SocketContext } from '~/context/socket/SocketContext';
import { useUserDataLoader } from '~/routes/(authed)/layout';
import type { Task as ITask } from '~/server/services/task/entities/task';
import { Button } from '~/components/ui/button/button';

export interface TaskProps {
  task: ITask;
  authorId: string;
  userAuthId: string;
}

export const Task = component$<TaskProps>(({ task, authorId, userAuthId }) => {
  const spanishDateFormat = useSignal('');
  const { socket } = useContext(SocketContext);
  const userData = useUserDataLoader();
  const nav = useNavigate();

  // runs on the server which means it runs before the render the component thanks to resumability
  useTask$(() => {
    // from utc format to input date format in date-fns
    // format from utc to readable date format in spanish

    spanishDateFormat.value = dateFns.format(
      new Date(task.deliveryDate),
      'dd/MM/yyyy'
    );
  });

  const handleSubmit = $((e: SubmitEvent) => {
    const target = e.target as HTMLFormElement;
    const formData = new FormData(target);

    const taskId = formData.get('taskId') as string;

    socket?.value?.send(
      JSON.stringify({
        type: 'delete-task',
        payload: { taskId },
      })
    );
  });

  const handleChangeState = $((e: SubmitEvent) => {
    const target = e.target as HTMLFormElement;
    const formData = new FormData(target);

    const taskId = formData.get('taskId') as string;
    const taskState = formData.get('taskState') as string;

    const userId = userData.value.user.id;

    socket?.value?.send(
      JSON.stringify({
        type: 'update-task-state',
        payload: { taskId, taskState, userId },
      })
    );
  });

  return (
    <div class="border-b p-5 flex justify-between items-center">
      <div>
        <p class="mb-1 text-xl">{task.name}</p>
        <p class="mb-1 text-sm text-gray-500 uppercase">{task.description}</p>
        <p class="mb-1 text-xl">{spanishDateFormat}</p>
        <p class="mb-1 text-gray-600">Priority: {task.priority}</p>
        {task.state && (
          <p class="text-xs bg-green-600 uppercase p-1 rounded-lg text-white">
            {/* Completada por: {task.userWhoCompletedTaskId?.name} */}
          </p>
        )}
      </div>

      <div class="flex flex-col lg:flex-row gap-2">
        {authorId === userAuthId && (
          <Button
            onClick$={() => {
              nav(`/projects/${task.projectId}/task/${task.id}/edit`);
            }}
            look="edit"
          >
            Editar
          </Button>
        )}

        {task.state ? (
          <form onSubmit$={handleChangeState} preventdefault:submit>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="taskState" value={0} />
            <Button type="submit" look="success">
              Completa
            </Button>
          </form>
        ) : (
          <form onSubmit$={handleChangeState} preventdefault:submit>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="taskState" value={1} />

            <Button type="submit" look="primary">
              Incompleta
            </Button>
          </form>
        )}

        {authorId === userAuthId && (
          <form onSubmit$={handleSubmit} preventdefault:submit>
            <input type="hidden" name="taskId" value={task.id} />
            <Button type="submit" look="destructive">
              Eliminar
            </Button>
          </form>
        )}
      </div>
    </div>
  );
});
