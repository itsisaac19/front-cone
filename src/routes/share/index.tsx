export const onGet = async ({ redirect }: RequestEvent) => {
    throw redirect(307, '/plan');
};