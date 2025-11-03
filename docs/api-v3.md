openapi: 3.0.0
info:
  title: Food Delivery API v3
  version: 3.0.0
  description: >
    Next-gen API for food ordering system.  
    All endpoints use JWT Bearer authentication unless marked as Public.

servers:
  - url: http://localhost:4000/api/v3

paths:
  /orders:
    post:
      summary: Create a new order
      tags: [Orders]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrderDto'
      responses:
        '201':
          description: Order created successfully
        '400':
          description: Validation error
        '401':
          description: Unauthorized

    get:
      summary: Get all orders for authenticated user (admin can filter)
      tags: [Orders]
      security:
        - bearerAuth: []
      parameters:
        - in: query
          name: branchId
          required: false
          schema:
            type: string
      responses:
        '200':
          description: List of orders

  /orders/{orderId}/status:
    patch:
      summary: Update order status
      tags: [Orders]
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: orderId
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  enum: [pending, confirmed, preparing, delivered, cancelled]
      responses:
        '200':
          description: Status updated
        '403':
          description: Forbidden

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    CreateOrderDto:
      type: object
      required: [branchId, items, address]
      properties:
        branchId:
          type: string
        items:
          type: array
          items:
            type: object
            required: [foodVariantId, quantity]
            properties:
              foodVariantId:
                type: string
              quantity:
                type: integer
              notes:
                type: string
        address:
          type: object
          required: [street, city]
          properties:
            street:
              type: string
            city:
              type: string
            lat:
              type: number
            lng:
              type: number
