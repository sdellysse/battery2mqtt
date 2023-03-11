export const readRegister = async (
  baseUrl: string,
  address: number,
  register: number,
  length: number
) => {
  const response = await fetch(`${baseUrl}/read_register`, {
    body: JSON.stringify({ address, register, length }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const responseBody = await response.arrayBuffer();

  return Buffer.from(responseBody);
};
