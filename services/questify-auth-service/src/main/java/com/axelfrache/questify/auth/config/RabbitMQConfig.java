package com.axelfrache.questify.auth.config;

import com.axelfrache.questify.auth.messaging.QueueConstants;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

  @Bean
  public TopicExchange questifyExchange() {
    return new TopicExchange(QueueConstants.EXCHANGE, true, false);
  }

  @Bean
  public Queue adminUserDeletedQueue() {
    return QueueBuilder.durable(QueueConstants.ADMIN_USER_DELETED_QUEUE).build();
  }

  @Bean
  public Queue adminUserRoleChangedQueue() {
    return QueueBuilder.durable(QueueConstants.ADMIN_USER_ROLE_CHANGED_QUEUE).build();
  }

  @Bean
  public Queue adminUserStatusChangedQueue() {
    return QueueBuilder.durable(QueueConstants.ADMIN_USER_STATUS_CHANGED_QUEUE).build();
  }

  @Bean
  public Binding adminUserDeletedBinding() {
    return BindingBuilder.bind(adminUserDeletedQueue())
        .to(questifyExchange())
        .with(QueueConstants.ADMIN_USER_DELETED_ROUTING_KEY);
  }

  @Bean
  public Binding adminUserRoleChangedBinding() {
    return BindingBuilder.bind(adminUserRoleChangedQueue())
        .to(questifyExchange())
        .with(QueueConstants.ADMIN_USER_ROLE_CHANGED_ROUTING_KEY);
  }

  @Bean
  public Binding adminUserStatusChangedBinding() {
    return BindingBuilder.bind(adminUserStatusChangedQueue())
        .to(questifyExchange())
        .with(QueueConstants.ADMIN_USER_STATUS_CHANGED_ROUTING_KEY);
  }

  @Bean
  public Jackson2JsonMessageConverter messageConverter() {
    return new Jackson2JsonMessageConverter();
  }

  @Bean
  public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
    var template = new RabbitTemplate(connectionFactory);
    template.setMessageConverter(messageConverter());
    return template;
  }
}
