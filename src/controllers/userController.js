
import { prisma } from "../config/prisma.js";
import { hashPassword } from "../utils/password.js";

function validateUserId(id) {
  return Number.isInteger(id) && id > 0;
}

function isAdmin(req) {
  return req.user.role === "ADMIN";
}

export async function getUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!validateUserId(id)) {
      return res.status(400).json({
        message: "Некоректний ID користувача"
      });
    }

    if (!isAdmin(req) && req.user.userId !== id) {
      return res.status(403).json({
        message: "Ви можете переглядати лише власний профіль"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        message: "Користувача не знайдено"
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, password, roleId } = req.body;

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId
      },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!validateUserId(id)) {
      return res.status(400).json({
        message: "Некоректний ID користувача"
      });
    }

    if (!isAdmin(req) && req.user.userId !== id) {
      return res.status(403).json({
        message: "Ви можете редагувати лише власний профіль"
      });
    }

    if (!isAdmin(req) && req.body.roleId !== undefined) {
      return res.status(403).json({
        message: "Змінювати роль може лише адміністратор"
      });
    }

    const data = {};

    if (req.body.name !== undefined) {
      data.name = req.body.name;
    }

    if (req.body.email !== undefined) {
      data.email = req.body.email;
    }

    if (req.body.password !== undefined) {
      data.password = await hashPassword(req.body.password);
    }

    if (isAdmin(req) && req.body.roleId !== undefined) {
      data.roleId = req.body.roleId;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "Немає даних для оновлення"
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!validateUserId(id)) {
      return res.status(400).json({
        message: "Некоректний ID користувача"
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      message: "Користувача успішно видалено"
    });
  } catch (error) {
    next(error);
  }
}
