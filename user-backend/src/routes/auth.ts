import { getDB } from '../db';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyMessage } from 'ethers';
import type { User, LoginRequest, RegisterRequest, MetaMaskAuthRequest, DIDAuthRequest } from '../types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export async function register(req: Request): Promise<Response> {
  try {
    const body: RegisterRequest = await req.json();
    const { email, password, firstName, lastName, role } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDB();
    const usersCollection = db.collection<User>('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return Response.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await hash(password, SALT_ROUNDS);

    const user: Omit<User, '_id'> = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      authMethod: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(user as User);

    const token = jwt.sign(
      { userId: result.insertedId.toString(), email, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return Response.json({
      success: true,
      token,
      user: {
        id: result.insertedId.toString(),
        email,
        firstName,
        lastName,
        role,
        authMethod: 'email',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ error: 'Registration failed' }, { status: 500 });
  }
}

export async function login(req: Request): Promise<Response> {
  try {
    const body: LoginRequest = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const db = getDB();
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({ email });
    if (!user || !user.password) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user._id?.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return Response.json({
      success: true,
      token,
      user: {
        id: user._id?.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        authMethod: user.authMethod,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}

export async function metamaskAuth(req: Request): Promise<Response> {
  try {
    const body: MetaMaskAuthRequest = await req.json();
    const { walletAddress, signature, message } = body;

    if (!walletAddress || !signature || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const db = getDB();
    const usersCollection = db.collection<User>('users');

    let user = await usersCollection.findOne({ walletAddress });

    if (!user) {
      const newUser: Omit<User, '_id'> = {
        email: `${walletAddress}@metamask.local`,
        firstName: 'MetaMask',
        lastName: 'User',
        role: 'Farmer',
        walletAddress,
        authMethod: 'metamask',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser as User);
      user = { ...newUser, _id: result.insertedId } as User;
    }

    const token = jwt.sign(
      { userId: user._id?.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return Response.json({
      success: true,
      token,
      user: {
        id: user._id?.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        walletAddress: user.walletAddress,
        authMethod: 'metamask',
      },
    });
  } catch (error) {
    console.error('MetaMask auth error:', error);
    return Response.json({ error: 'MetaMask authentication failed' }, { status: 500 });
  }
}

export async function didAuth(req: Request): Promise<Response> {
  try {
    const body: DIDAuthRequest = await req.json();
    const { didIdentifier, provider } = body;

    if (!didIdentifier || !provider) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDB();
    const usersCollection = db.collection<User>('users');

    let user = await usersCollection.findOne({ didIdentifier });

    if (!user) {
      const newUser: Omit<User, '_id'> = {
        email: `${didIdentifier}@did.local`,
        firstName: 'DID',
        lastName: 'User',
        role: 'Student',
        didIdentifier,
        authMethod: 'did',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser as User);
      user = { ...newUser, _id: result.insertedId } as User;
    }

    const token = jwt.sign(
      { userId: user._id?.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return Response.json({
      success: true,
      token,
      user: {
        id: user._id?.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        didIdentifier: user.didIdentifier,
        authMethod: 'did',
      },
    });
  } catch (error) {
    console.error('DID auth error:', error);
    return Response.json({ error: 'DID authentication failed' }, { status: 500 });
  }
}

export async function getProfile(req: Request, userId: string): Promise<Response> {
  try {
    const db = getDB();
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({ _id: userId as any });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      id: user._id?.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      authMethod: user.authMethod,
      walletAddress: user.walletAddress,
      didIdentifier: user.didIdentifier,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return Response.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}
