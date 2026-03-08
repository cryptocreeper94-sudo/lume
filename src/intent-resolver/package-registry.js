/**
 * ═══════════════════════════════════════════════════════
 *  GAP 9: NPM Package Integration — English Mode
 *
 *  - Built-in registry of 25+ npm packages
 *  - `use [Library] to ...` pattern recognition
 *  - Auto-install prompts & LUME-E060 for CI
 *  - Package-context-aware tolerance chain
 * ═══════════════════════════════════════════════════════
 */

// ── Built-in Package Registry ──
export const PACKAGE_REGISTRY = {
    express: {
        npm: 'express', aliases: ['Express', 'express.js', 'expressjs'],
        capabilities: ['web server', 'API', 'routes', 'middleware', 'REST'],
        importStyle: "const express = require('express');",
        importESM: "import express from 'express';",
        contextHints: {
            'create a web server': "const app = express();",
            'add a route': "app.METHOD(PATH, HANDLER);",
            'middleware': "app.use(MIDDLEWARE);",
            'start the server': "app.listen(PORT);",
            'JSON parsing': "app.use(express.json());",
        },
    },
    axios: {
        npm: 'axios', aliases: ['Axios'],
        capabilities: ['HTTP requests', 'fetch data', 'API calls', 'REST client'],
        importStyle: "const axios = require('axios');",
        importESM: "import axios from 'axios';",
        contextHints: {
            'get data': "const { data } = await axios.get(URL);",
            'post data': "const { data } = await axios.post(URL, BODY);",
        },
    },
    lodash: {
        npm: 'lodash', aliases: ['Lodash', 'underscore', '_'],
        capabilities: ['sort', 'filter', 'group', 'debounce', 'throttle', 'deep clone', 'merge', 'uniq'],
        importStyle: "const _ = require('lodash');",
        importESM: "import _ from 'lodash';",
        contextHints: {
            'sort by': "_.sortBy(COLLECTION, KEY);",
            'group by': "_.groupBy(COLLECTION, KEY);",
            'deep clone': "_.cloneDeep(OBJECT);",
            'debounce': "_.debounce(FN, MS);",
            'unique': "_.uniq(ARRAY);",
        },
    },
    prisma: {
        npm: '@prisma/client', aliases: ['Prisma', 'prisma ORM', 'Prisma ORM'],
        capabilities: ['database', 'ORM', 'query', 'schema', 'PostgreSQL', 'MySQL', 'SQLite'],
        importStyle: "const { PrismaClient } = require('@prisma/client');",
        importESM: "import { PrismaClient } from '@prisma/client';",
        setup: "const prisma = new PrismaClient();",
        contextHints: {
            'get all': "await prisma.MODEL.findMany();",
            'find by': "await prisma.MODEL.findUnique({ where: { FIELD: VALUE } });",
            'create': "await prisma.MODEL.create({ data: DATA });",
            'update': "await prisma.MODEL.update({ where: { FIELD: VALUE }, data: DATA });",
            'delete': "await prisma.MODEL.delete({ where: { FIELD: VALUE } });",
        },
    },
    react: {
        npm: 'react', aliases: ['React', 'ReactJS'],
        capabilities: ['UI', 'components', 'hooks', 'state', 'frontend', 'JSX'],
        importStyle: "const React = require('react');",
        importESM: "import React from 'react';",
        contextHints: {
            'component': "function Component() { return <div/>; }",
            'state': "const [state, setState] = React.useState(initial);",
            'effect': "React.useEffect(() => { }, []);",
        },
    },
    mongoose: {
        npm: 'mongoose', aliases: ['Mongoose', 'MongoDB ODM'],
        capabilities: ['MongoDB', 'database', 'schema', 'model', 'NoSQL'],
        importStyle: "const mongoose = require('mongoose');",
        importESM: "import mongoose from 'mongoose';",
        contextHints: {
            'connect to database': "await mongoose.connect(URI);",
            'create a schema': "const schema = new mongoose.Schema({ });",
        },
    },
    'socket.io': {
        npm: 'socket.io', aliases: ['Socket.IO', 'SocketIO', 'websockets', 'WebSocket'],
        capabilities: ['real-time', 'websocket', 'events', 'chat', 'live updates'],
        importStyle: "const { Server } = require('socket.io');",
        importESM: "import { Server } from 'socket.io';",
    },
    jsonwebtoken: {
        npm: 'jsonwebtoken', aliases: ['JWT', 'json web token', 'tokens'],
        capabilities: ['authentication', 'JWT', 'token', 'sign', 'verify'],
        importStyle: "const jwt = require('jsonwebtoken');",
        importESM: "import jwt from 'jsonwebtoken';",
    },
    bcrypt: {
        npm: 'bcrypt', aliases: ['bcrypt', 'password hashing'],
        capabilities: ['password', 'hash', 'compare', 'security', 'encryption'],
        importStyle: "const bcrypt = require('bcrypt');",
        importESM: "import bcrypt from 'bcrypt';",
    },
    nodemailer: {
        npm: 'nodemailer', aliases: ['Nodemailer', 'email sender'],
        capabilities: ['email', 'send email', 'SMTP', 'mail'],
        importStyle: "const nodemailer = require('nodemailer');",
        importESM: "import nodemailer from 'nodemailer';",
    },
    multer: {
        npm: 'multer', aliases: ['Multer', 'file upload'],
        capabilities: ['file upload', 'multipart', 'form data', 'upload'],
        importStyle: "const multer = require('multer');",
        importESM: "import multer from 'multer';",
    },
    cors: {
        npm: 'cors', aliases: ['CORS'],
        capabilities: ['CORS', 'cross-origin', 'middleware'],
        importStyle: "const cors = require('cors');",
        importESM: "import cors from 'cors';",
    },
    dotenv: {
        npm: 'dotenv', aliases: ['dotenv', 'environment variables'],
        capabilities: ['environment', 'config', '.env', 'env vars'],
        importStyle: "require('dotenv').config();",
        importESM: "import 'dotenv/config';",
    },
    chalk: {
        npm: 'chalk', aliases: ['Chalk', 'colors', 'terminal colors'],
        capabilities: ['colors', 'terminal', 'CLI', 'styling'],
        importStyle: "const chalk = require('chalk');",
        importESM: "import chalk from 'chalk';",
    },
    'date-fns': {
        npm: 'date-fns', aliases: ['date-fns', 'date functions'],
        capabilities: ['dates', 'format date', 'parse date', 'date math'],
        importStyle: "const { format } = require('date-fns');",
        importESM: "import { format } from 'date-fns';",
    },
    zod: {
        npm: 'zod', aliases: ['Zod', 'schema validation'],
        capabilities: ['validation', 'schema', 'type checking', 'parse'],
        importStyle: "const { z } = require('zod');",
        importESM: "import { z } from 'zod';",
    },
    cheerio: {
        npm: 'cheerio', aliases: ['Cheerio', 'HTML parser', 'scraper'],
        capabilities: ['scraping', 'HTML', 'parse HTML', 'web scraping'],
        importStyle: "const cheerio = require('cheerio');",
        importESM: "import * as cheerio from 'cheerio';",
    },
    sharp: {
        npm: 'sharp', aliases: ['Sharp', 'image processing'],
        capabilities: ['images', 'resize', 'crop', 'image processing', 'thumbnails'],
        importStyle: "const sharp = require('sharp');",
        importESM: "import sharp from 'sharp';",
    },
    stripe: {
        npm: 'stripe', aliases: ['Stripe', 'payments'],
        capabilities: ['payments', 'billing', 'subscriptions', 'checkout'],
        importStyle: "const Stripe = require('stripe');",
        importESM: "import Stripe from 'stripe';",
    },
    redis: {
        npm: 'redis', aliases: ['Redis'],
        capabilities: ['cache', 'key-value', 'pub/sub', 'session store'],
        importStyle: "const redis = require('redis');",
        importESM: "import { createClient } from 'redis';",
    },
    'node-cron': {
        npm: 'node-cron', aliases: ['cron', 'scheduler', 'scheduled tasks'],
        capabilities: ['cron', 'schedule', 'recurring', 'timer'],
        importStyle: "const cron = require('node-cron');",
        importESM: "import cron from 'node-cron';",
    },
    winston: {
        npm: 'winston', aliases: ['Winston', 'logger'],
        capabilities: ['logging', 'log files', 'log levels'],
        importStyle: "const winston = require('winston');",
        importESM: "import winston from 'winston';",
    },
    helmet: {
        npm: 'helmet', aliases: ['Helmet'],
        capabilities: ['security', 'HTTP headers', 'middleware'],
        importStyle: "const helmet = require('helmet');",
        importESM: "import helmet from 'helmet';",
    },
    sequelize: {
        npm: 'sequelize', aliases: ['Sequelize', 'SQL ORM'],
        capabilities: ['database', 'SQL', 'ORM', 'PostgreSQL', 'MySQL'],
        importStyle: "const { Sequelize } = require('sequelize');",
        importESM: "import { Sequelize } from 'sequelize';",
    },
    puppeteer: {
        npm: 'puppeteer', aliases: ['Puppeteer', 'headless browser', 'browser automation'],
        capabilities: ['browser', 'automation', 'screenshot', 'scraping', 'testing'],
        importStyle: "const puppeteer = require('puppeteer');",
        importESM: "import puppeteer from 'puppeteer';",
    },
}

/**
 * Detect `use [Library] to ...` pattern
 */
export function detectPackageReference(line) {
    const match = line.match(/^use\s+(\S+(?:\s+\S+)?)\s+to\s+(.+)$/i)
    if (!match) return null
    return { packageName: match[1].trim(), instruction: match[2].trim() }
}

/**
 * Recognize a package name from the registry (case-insensitive, alias-aware)
 */
export function recognizePackage(name) {
    const lower = name.toLowerCase()
    // Direct match
    if (PACKAGE_REGISTRY[lower]) return { key: lower, ...PACKAGE_REGISTRY[lower] }
    // Alias match
    for (const [key, pkg] of Object.entries(PACKAGE_REGISTRY)) {
        for (const alias of pkg.aliases) {
            if (alias.toLowerCase() === lower) return { key, ...pkg }
        }
    }
    // Capability match — fuzzy
    for (const [key, pkg] of Object.entries(PACKAGE_REGISTRY)) {
        for (const cap of pkg.capabilities) {
            if (cap.toLowerCase() === lower || lower.includes(cap.toLowerCase())) {
                return { key, ...pkg, matchedBy: 'capability' }
            }
        }
    }
    return null
}

/**
 * Generate import statement for a recognized package
 */
export function generateImport(pkg, style = 'esm') {
    if (style === 'cjs') return pkg.importStyle
    return pkg.importESM || pkg.importStyle
}

/**
 * Get context hints for a package (used to enhance tolerance chain)
 */
export function getPackageContext(packageKey, instruction) {
    const pkg = PACKAGE_REGISTRY[packageKey]
    if (!pkg || !pkg.contextHints) return null
    const lower = instruction.toLowerCase()
    for (const [hint, code] of Object.entries(pkg.contextHints)) {
        if (lower.includes(hint.toLowerCase())) return { hint, code }
    }
    return null
}

/**
 * Check if a package is installed in the project
 */
export function isPackageInstalled(npmName, projectRoot = '.') {
    try {
        const fs = require('node:fs')
        const path = require('node:path')
        const pkgPath = path.join(projectRoot, 'node_modules', npmName)
        return fs.existsSync(pkgPath)
    } catch { return false }
}

/**
 * Format LUME-E060 error for missing package (non-interactive)
 */
export function formatMissingPackageError(packageName, npmName, line) {
    return {
        code: 'LUME-E060',
        severity: 'error',
        message: `Package "${packageName}" (npm: ${npmName}) is not installed.`,
        suggestion: `Run \`npm install ${npmName}\` or \`lume install ${npmName}\` to install it.`,
        line,
    }
}

/**
 * Format interactive package prompt
 */
export function formatPackagePrompt(packageName, npmName) {
    return `[lume] ${packageName} (npm: ${npmName}) is not installed.\n  Install it? (y/n) `
}

/**
 * Format unknown package prompt
 */
export function formatUnknownPackagePrompt(name) {
    return [
        `[lume] I don't recognize "${name}" as a known package.`,
        `  1. Search npm for "${name.toLowerCase()}"`,
        `  2. It's a local module (search project files)`,
        `  3. Let me specify the npm package name`,
        `  4. Skip this — I'll handle the import in a raw: block`,
    ].join('\n')
}
