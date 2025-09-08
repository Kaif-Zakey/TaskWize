import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { onSnapshot } from "firebase/firestore";
import { tasksRef } from "@/service/taskService";
import { Task } from "@/types/task";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Home = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const loadProfileImage = React.useCallback(async () => {
    if (!authUser) return;

    try {
      const savedProfile = await AsyncStorage.getItem("userProfile");
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        if (parsedProfile.profileImage) {
          setProfileImage(parsedProfile.profileImage);
        } else if (authUser?.photoURL) {
          setProfileImage(authUser.photoURL);
        }
      } else if (authUser?.photoURL) {
        setProfileImage(authUser.photoURL);
      }
    } catch (error) {
      console.error("Error loading profile image:", error);
      // Fallback to Firebase Auth photo
      if (authUser?.photoURL) {
        setProfileImage(authUser.photoURL);
      }
    }
  }, [authUser]);

  useEffect(() => {
    setUser(authUser);
    loadProfileImage();
  }, [authUser, loadProfileImage]);

  // Reload profile image when screen comes into focus (e.g., after updating profile)
  useFocusEffect(
    React.useCallback(() => {
      loadProfileImage();
    }, [loadProfileImage])
  );

  useEffect(() => {
    if (!authUser?.uid) {
      setTasks([]);
      return;
    }

    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const allTasks = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Task)
          .filter((task) => task.userId === authUser?.uid);

        setTasks(allTasks);
      },
      (err) => {
        console.error("Error listening to tasks:", err);
      }
    );

    return () => unsubscribe();
  }, [authUser?.uid]); // Only depend on the uid, not the whole user object

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "high" && task.status === "pending"
  ).length;
  const tasksWithLocation = tasks.filter((task) => task.location).length;

  // Get tasks by category
  const tasksByCategory = tasks.reduce(
    (acc, task) => {
      const category = task.category || "Other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Get recent pending tasks (last 5)
  const recentPendingTasks = tasks
    .filter((task) => task.status === "pending")
    .sort(
      (a, b) =>
        new Date(b.createdAt || "").getTime() -
        new Date(a.createdAt || "").getTime()
    )
    .slice(0, 3);

  // Get today's tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow && task.status === "pending";
  });

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingTop: insets.top + 20,
          paddingBottom: 32,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View>
            <Text style={{ color: "white", fontSize: 23, fontWeight: "bold" }}>
              {user?.email
                ? user.email
                    .split("@")[0]
                    .replace(/[0-9]/g, "")
                    .replace(/\./g, "")
                    .replace(/_/g, "")
                : "User"}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              padding: profileImage ? 2 : 12,
              borderRadius: 50,
              width: 48,
              height: 48,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => router.push("/(dashboard)/profile")}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                }}
                resizeMode="cover"
              />
            ) : (
              <MaterialIcons name="person" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Completion Progress */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            padding: 16,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              marginBottom: 8,
              fontWeight: "500",
            }}
          >
            Task Completion Rate
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{ color: colors.text, fontSize: 30, fontWeight: "bold" }}
            >
              {completionRate}%
            </Text>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <View
                style={{
                  backgroundColor: colors.border,
                  height: 8,
                  borderRadius: 4,
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.primary,
                    height: 8,
                    borderRadius: 4,
                    width: `${completionRate}%`,
                  }}
                />
              </View>
            </View>
          </View>
          <Text
            style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}
          >
            {completedTasks} of {totalTasks} tasks completed
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: colors.text,
            marginBottom: 16,
          }}
        >
          Quick Overview
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              width: "48%",
              marginBottom: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <MaterialIcons name="task-alt" size={24} color={colors.info} />
              <Text
                style={{
                  marginLeft: 8,
                  color: colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                Total Tasks
              </Text>
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              {totalTasks}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              width: "48%",
              marginBottom: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <MaterialIcons name="pending" size={24} color={colors.warning} />
              <Text
                style={{
                  marginLeft: 8,
                  color: colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                Pending
              </Text>
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.warning,
              }}
            >
              {pendingTasks}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              width: "48%",
              marginBottom: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <MaterialIcons
                name="check-circle"
                size={24}
                color={colors.success}
              />
              <Text
                style={{
                  marginLeft: 8,
                  color: colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                Completed
              </Text>
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.success,
              }}
            >
              {completedTasks}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              width: "48%",
              marginBottom: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <MaterialIcons
                name="priority-high"
                size={24}
                color={colors.error}
              />
              <Text
                style={{
                  marginLeft: 8,
                  color: colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                High Priority
              </Text>
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.error,
              }}
            >
              {highPriorityTasks}
            </Text>
          </View>
        </View>
      </View>

      {/* Categories Breakdown */}
      {Object.keys(tasksByCategory).length > 0 && (
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Tasks by Category
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            {Object.entries(tasksByCategory).map(([category, count]) => (
              <View
                key={category}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: colors.primary,
                      borderRadius: 6,
                      marginRight: 12,
                    }}
                  />
                  <Text
                    style={{
                      color: colors.text,
                      textTransform: "capitalize",
                    }}
                  >
                    {category}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "bold",
                  }}
                >
                  {count}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <MaterialIcons name="today" size={24} color={colors.error} />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text,
                marginLeft: 8,
              }}
            >
              Due Today
            </Text>
            <View
              style={{
                backgroundColor: colors.error + "20",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  color: colors.error,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {todayTasks.length}
              </Text>
            </View>
          </View>

          {todayTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={{
                backgroundColor: colors.error + "10",
                borderWidth: 1,
                borderColor: colors.error + "30",
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
              }}
              onPress={() => router.push(`/(dashboard)/tasks/${task.id}`)}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.error,
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text
                      style={{
                        color: colors.error,
                        opacity: 0.8,
                        fontSize: 14,
                        marginTop: 4,
                      }}
                      numberOfLines={1}
                    >
                      {task.description}
                    </Text>
                  )}
                </View>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={16}
                  color={colors.error}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Pending Tasks */}
      {recentPendingTasks.length > 0 && (
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              Recent Pending Tasks
            </Text>
            <TouchableOpacity onPress={() => router.push("/(dashboard)/tasks")}>
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "500",
                }}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {recentPendingTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
              onPress={() => router.push(`/(dashboard)/tasks/${task.id}`)}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 14,
                        marginTop: 4,
                      }}
                      numberOfLines={2}
                    >
                      {task.description}
                    </Text>
                  )}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    {task.category && (
                      <View
                        style={{
                          backgroundColor: colors.primary + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 12,
                            textTransform: "capitalize",
                          }}
                        >
                          {task.category}
                        </Text>
                      </View>
                    )}
                    {task.priority && (
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          backgroundColor:
                            task.priority === "high"
                              ? colors.error + "20"
                              : task.priority === "medium"
                                ? colors.warning + "20"
                                : colors.success + "20",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            textTransform: "capitalize",
                            color:
                              task.priority === "high"
                                ? colors.error
                                : task.priority === "medium"
                                  ? colors.warning
                                  : colors.success,
                          }}
                        >
                          {task.priority}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={16}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: colors.text,
            marginBottom: 16,
          }}
        >
          Quick Actions
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: 12,
              width: "48%",
              marginBottom: 12,
            }}
            onPress={() => router.push("/(dashboard)/tasks/new")}
          >
            <MaterialIcons name="add-task" size={28} color="white" />
            <Text style={{ color: "white", fontWeight: "600", marginTop: 8 }}>
              Add New Task
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: colors.success,
              padding: 16,
              borderRadius: 12,
              width: "48%",
              marginBottom: 12,
            }}
            onPress={() => router.push("/(dashboard)/tasks")}
          >
            <MaterialIcons name="list" size={28} color="white" />
            <Text style={{ color: "white", fontWeight: "600", marginTop: 8 }}>
              View All Tasks
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Productivity Tip */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <View
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <MaterialIcons name="lightbulb" size={24} color="white" />
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: 18,
                marginLeft: 8,
              }}
            >
              💡 Productivity Tip
            </Text>
          </View>
          <Text
            style={{
              color: "white",
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {completionRate >= 80
              ? "You're doing amazing! Consider setting more challenging goals to keep growing."
              : completionRate >= 60
                ? "Great progress! Try breaking larger tasks into smaller, manageable steps."
                : completionRate >= 40
                  ? "Keep going! Set specific times for task completion to build momentum."
                  : "Start small! Focus on completing just one task at a time to build confidence."}
          </Text>
        </View>
      </View>

      {/* Location-based Tasks Info */}
      {tasksWithLocation > 0 && (
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          <View
            style={{
              backgroundColor: colors.accent + "20",
              borderWidth: 1,
              borderColor: colors.accent + "30",
              padding: 16,
              borderRadius: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <MaterialIcons
                name="location-on"
                size={24}
                color={colors.accent}
              />
              <Text
                style={{
                  marginLeft: 8,
                  color: colors.accent,
                  fontWeight: "bold",
                }}
              >
                Location-Based Tasks
              </Text>
            </View>
            <Text style={{ color: colors.accent }}>
              You have {tasksWithLocation} task
              {tasksWithLocation !== 1 ? "s" : ""} with location reminders set
              up.
            </Text>
          </View>
        </View>
      )}

      {/* Empty State */}
      {totalTasks === 0 && (
        <View style={{ paddingHorizontal: 24, paddingVertical: 32 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 32,
              borderRadius: 12,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <MaterialIcons
              name="task-alt"
              size={64}
              color={colors.textSecondary}
            />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.textSecondary,
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              No tasks yet!
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Start organizing your life by creating your first task.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
              }}
              onPress={() => router.push("/(dashboard)/tasks/new")}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Create Your First Task
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className="h-20" />
    </ScrollView>
  );
};

export default Home;
